import os
from datetime import datetime, timedelta

import requests
from dotenv import load_dotenv

from .base import BaseDataSource


class SAMGovDataSource(BaseDataSource):
    """
    Safe connector for the official SAM.gov Opportunities API.

    This connector fetches and normalizes records.
    It does not write anything to the database.
    """

    SOURCE_NAME = "sam_gov"

    def __init__(self):
        load_dotenv()

        self.api_key = os.getenv("SAM_GOV_API_KEY")

        self.base_url = (
            "https://api.sam.gov/prod/opportunities/v2/search"
        )

    def get_source_name(self):
        return self.SOURCE_NAME

    def fetch_records(self, limit=5):

        if not self.api_key:
            print(
                "WARNING: SAM_GOV_API_KEY is not configured. "
                "Returning no records."
            )
            return []

        limit = max(1, min(int(limit), 25))

        today = datetime.now()
        posted_from = today - timedelta(days=7)

        params = {
            "api_key": self.api_key,
            "limit": limit,
            "postedFrom": posted_from.strftime("%m/%d/%Y"),
            "postedTo": today.strftime("%m/%d/%Y"),
        }

        try:
            response = requests.get(
                self.base_url,
                params=params,
                timeout=15,
            )

            response.raise_for_status()

            data = response.json()

            opportunities = data.get(
                "opportunitiesData",
                [],
            )

            normalized_records = []

            for record in opportunities:

                normalized = self._normalize_record(record)

                if normalized:
                    normalized_records.append(normalized)

            return normalized_records

        except requests.exceptions.RequestException as error:

            print(f"SAM.gov request failed: {error}")

            return []

        except ValueError as error:

            print(f"SAM.gov response parsing failed: {error}")

            return []

    def _normalize_record(self, record):

        notice_id = record.get("noticeId")

        if not notice_id:
            return None

        solicitation_number = record.get(
            "solicitationNumber"
        )

        title = record.get("title")

        posted_date = record.get("postedDate")

        response_deadline = record.get(
            "responseDeadLine"
        )

        classification_code = record.get(
            "classificationCode"
        )

        naics_code = record.get("naicsCode")

        place_of_performance = record.get(
            "placeOfPerformance"
        )

        ui_link = record.get("uiLink")

        category = classification_code

        if naics_code:
            category = f"NAICS {naics_code}"

        region = None

        if isinstance(place_of_performance, dict):

            region = (
                place_of_performance.get("state")
                or place_of_performance.get("city")
            )

        return {
            "source": self.SOURCE_NAME,

            "external_id": notice_id,

            "tender_id": solicitation_number
            or notice_id,

            "vendor_id": None,

            "vendor_name": None,

            "title": title,

            "category": category,

            "region": region,

            "publication_date": posted_date,

            "closing_date": response_deadline,

            "contract_value": None,

            "currency": "USD",

            "source_url": ui_link,

            "raw_data": record,
        }