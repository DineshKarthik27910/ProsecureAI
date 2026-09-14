# ProcureAI

AI-powered procurement risk intelligence platform for identifying suspicious tender and supplier patterns.

## 🚨 Problem

Public procurement has thousands of tenders, making it difficult to manually identify unusual bidding and supplier behavior.

## 💡 Solution

ProcureAI analyzes procurement data using AI, rule-based detection, and supplier relationship analysis to generate a risk score from 0–100.

## ✨ Features

📊 Procurement Dashboard

🔍 Tender Search & Filtering

🧠 AI Risk Analysis

⚠️ High-Risk Tender Detection

🕸️ Supplier Network Analysis

📡 Live Procurement Monitoring

## 🧠 AI / Risk Detection

Rule-based risk detection

Isolation Forest anomaly detection

Supplier relationship analysis

Explainable risk scoring

## 🛠️ Tech Stack

Frontend: React, Vite, Recharts

Backend: Python, FastAPI, Pandas

AI/ML: Scikit-learn, Isolation Forest

Database: SQLite

## 🚀 Run Locally

### Backend

cd backend
.venv\Scripts\activate
pip install -r requirements.txt
python -m database.init_db
uvicorn server:app --reload --port 8000

### Frontend

cd frontend
npm install
npm run dev

Open http://localhost:5173

## 🎬 Demo

Open the dashboard

View high-risk tenders

Select a tender

View its risk factors

Explore the supplier network

## 🎯 Goal

Find the tenders that deserve investigation first.

ProcureAI is a decision-support system. A high-risk score indicates a pattern worth investigating; it does not by itself prove wrongdoing.

## 👥 Team Members

J. Akshit

D. Surya Sanjeev

R. Dinesh Karthik

K. Komal Karthikeyan

A. Naga Sakthi Swaroop
