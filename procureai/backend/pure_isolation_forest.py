"""
ProcureAI - Pure NumPy Isolation Forest and MinMaxScaler.

A zero-dependency implementation of Isolation Forest (Liu, Ting, Zhou, 2008)
designed to run without loading third-party C/Fortran extension DLLs that
may be blocked by Windows Defender Smart App Control.

Uses ONLY Python standard library and NumPy.
"""

from __future__ import annotations

import math
from typing import List, Optional, Tuple
import numpy as np


def _c(n: int | float) -> float:
    """
    Average path length of unsuccessful search in a Binary Search Tree (BST).
    c(n) = 2 * (ln(n - 1) + 0.5772156649) - (2 * (n - 1) / n) for n > 2.
    c(2) = 1.0, c(n <= 1) = 0.0.
    """
    if n <= 1:
        return 0.0
    if n == 2:
        return 1.0
    euler_mascheroni = 0.5772156649
    return 2.0 * (math.log(n - 1.0) + euler_mascheroni) - (2.0 * (n - 1.0) / n)


class _Node:
    __slots__ = ("feature", "split", "left", "right", "size", "is_leaf")

    def __init__(
        self,
        feature: int = -1,
        split: float = 0.0,
        left: Optional[_Node] = None,
        right: Optional[_Node] = None,
        size: int = 0,
        is_leaf: bool = False,
    ):
        self.feature = feature
        self.split = split
        self.left = left
        self.right = right
        self.size = size
        self.is_leaf = is_leaf


def _build_tree(
    X: np.ndarray,
    current_depth: int,
    max_depth: int,
    rng: np.random.Generator,
) -> _Node:
    n_samples, n_features = X.shape

    if n_samples <= 1 or current_depth >= max_depth:
        return _Node(size=n_samples, is_leaf=True)

    # Find candidate features with non-zero variance
    mins = np.min(X, axis=0)
    maxs = np.max(X, axis=0)
    valid_features = np.where(mins < maxs)[0]

    if len(valid_features) == 0:
        return _Node(size=n_samples, is_leaf=True)

    feat = int(rng.choice(valid_features))
    feat_min = mins[feat]
    feat_max = maxs[feat]

    split_val = float(rng.uniform(feat_min, feat_max))

    left_mask = X[:, feat] < split_val
    n_left = int(np.sum(left_mask))

    if n_left == 0 or n_left == n_samples:
        return _Node(size=n_samples, is_leaf=True)

    left_node = _build_tree(X[left_mask], current_depth + 1, max_depth, rng)
    right_node = _build_tree(X[~left_mask], current_depth + 1, max_depth, rng)

    return _Node(
        feature=feat,
        split=split_val,
        left=left_node,
        right=right_node,
        size=n_samples,
        is_leaf=False,
    )


def _tree_path_lengths(X: np.ndarray, root: _Node) -> np.ndarray:
    """Compute path lengths for all samples in X down a single isolation tree."""
    n_samples = len(X)
    lengths = np.zeros(n_samples, dtype=np.float64)

    # Iterative traversal with (node, sample_indices, current_depth)
    stack: List[Tuple[_Node, np.ndarray, float]] = [(root, np.arange(n_samples), 0.0)]

    while stack:
        node, idxs, depth = stack.pop()
        if len(idxs) == 0:
            continue
        if node.is_leaf:
            lengths[idxs] = depth + _c(node.size)
        else:
            vals = X[idxs, node.feature]
            left_mask = vals < node.split
            left_idxs = idxs[left_mask]
            right_idxs = idxs[~left_mask]

            if len(left_idxs) > 0 and node.left is not None:
                stack.append((node.left, left_idxs, depth + 1.0))
            if len(right_idxs) > 0 and node.right is not None:
                stack.append((node.right, right_idxs, depth + 1.0))

    return lengths


class PureIsolationForest:
    """
    Pure NumPy implementation of Isolation Forest matching Scikit-Learn API.
    """

    def __init__(
        self,
        n_estimators: int = 200,
        max_samples: int | str = 256,
        contamination: float = 0.12,
        random_state: Optional[int] = 42,
        n_jobs: int = -1,
    ):
        self.n_estimators = n_estimators
        self.max_samples = max_samples
        self.contamination = contamination
        self.random_state = random_state
        self.n_jobs = n_jobs
        self.trees: List[_Node] = []
        self.max_samples_: int = 256
        self.offset_: float = -0.5

    def fit(self, X: np.ndarray | object, y: Optional[object] = None) -> "PureIsolationForest":
        arr = np.asarray(X, dtype=np.float64)
        n_samples, _ = arr.shape

        if isinstance(self.max_samples, int):
            self.max_samples_ = min(self.max_samples, n_samples)
        else:
            self.max_samples_ = min(256, n_samples)

        max_depth = int(math.ceil(math.log2(max(self.max_samples_, 2))))
        rng = np.random.default_rng(self.random_state)

        self.trees = []
        for _ in range(self.n_estimators):
            if n_samples <= self.max_samples_:
                sub_indices = np.arange(n_samples)
            else:
                sub_indices = rng.choice(n_samples, size=self.max_samples_, replace=False)

            tree_root = _build_tree(arr[sub_indices], 0, max_depth, rng)
            self.trees.append(tree_root)

        # Determine decision offset based on contamination
        dec_scores = self.decision_function(arr)
        self.offset_ = float(np.percentile(dec_scores, 100.0 * self.contamination))
        return self

    def _compute_path_lengths(self, X: np.ndarray) -> np.ndarray:
        arr = np.asarray(X, dtype=np.float64)
        total_lengths = np.zeros(len(arr), dtype=np.float64)
        for tree in self.trees:
            total_lengths += _tree_path_lengths(arr, tree)
        return total_lengths / max(len(self.trees), 1)

    def decision_function(self, X: np.ndarray | object) -> np.ndarray:
        """
        Average anomaly score of X of the base classifiers.
        Matches scikit-learn convention: decision_function = 0.5 - s(X).
        Lower / negative scores correspond to anomalies.
        """
        arr = np.asarray(X, dtype=np.float64)
        avg_paths = self._compute_path_lengths(arr)
        c_val = _c(self.max_samples_)
        if c_val <= 0.0:
            c_val = 1.0

        scores = 2.0 ** (-avg_paths / c_val)
        return 0.5 - scores

    def predict(self, X: np.ndarray | object) -> np.ndarray:
        """
        Predict if a particular sample is an outlier or not.
        Returns: +1 for inliers, -1 for outliers/anomalies.
        """
        dec = self.decision_function(X)
        is_inlier = dec >= self.offset_
        preds = np.ones(len(dec), dtype=int)
        preds[~is_inlier] = -1
        return preds


class PureMinMaxScaler:
    """Pure NumPy MinMaxScaler matching Scikit-Learn's MinMaxScaler(feature_range=(0, 100))."""

    def __init__(self, feature_range: Tuple[float, float] = (0, 100)):
        self.feature_range = feature_range
        self.data_min_: Optional[np.ndarray] = None
        self.data_max_: Optional[np.ndarray] = None

    def fit_transform(self, X: np.ndarray) -> np.ndarray:
        arr = np.asarray(X, dtype=np.float64)
        self.data_min_ = np.min(arr, axis=0)
        self.data_max_ = np.max(arr, axis=0)

        rng = self.data_max_ - self.data_min_
        rng = np.where(rng == 0.0, 1.0, rng)

        normed = (arr - self.data_min_) / rng
        low, high = self.feature_range
        return normed * (high - low) + low
