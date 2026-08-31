import re
from difflib import SequenceMatcher

# Generic hospital-industry words that make raw name-similarity misfire --
# e.g. "Ramaiah Medical College Hospital" vs "Kmct Medical College Hospital"
# score higher on shared boilerplate than genuine near-duplicates like
# "Al Shifa Hospital" vs "al Shifa" do. Stripping these before comparing
# means the score reflects what actually distinguishes one hospital from
# another. Validated against the real UAT directory on 2026-08-30 (see
# docs/Duplicate-Hospital-Decision-Brief-2026-08-29.md).
STOPWORDS = {
    "hospital", "hospitals", "hos", "medical", "college", "centre", "center",
    "clinic", "clinics", "diagnostic", "diagnostics", "multispeciality",
    "multispecialty", "nursing", "home", "institute", "trust", "memorial",
    "general", "govt", "government", "pvt", "ltd", "private", "care",
    "health", "healthcare", "and", "the", "for", "of", "mission", "&",
    "international", "research",
}

TOKEN_MATCH_RATIO = 0.82


def _tokenize(name: str) -> list[str]:
    cleaned = re.sub(r"[^a-z0-9\s]", " ", name.lower())
    tokens = [t for t in cleaned.split() if t]
    significant = [t for t in tokens if t not in STOPWORDS]
    return significant if significant else tokens  # every token was a stopword


def score_query_containment(query: str, candidate: str) -> float:
    """How much of `query` (the name someone just typed) is already covered
    by `candidate` (an existing account name), ignoring generic industry
    words. 1.0 = every significant word in query has a match in candidate;
    0.0 = nothing in common.

    Deliberately asymmetric (not a general similarity score) -- swapping the
    arguments changes the result. This is intentional: a short or incomplete
    query (e.g. "Aster") should score a full match against a longer real name
    that contains it (e.g. "Aster MIMS Calicut"), not get diluted by the
    candidate's extra words. An earlier symmetric version (dividing by
    max(len(query), len(candidate))) under-matched exactly this case --
    found 2026-08-30 when a bare "Aster" failed to warn against any of
    several real Aster-branded hospitals in the same zone. Re-validated
    against every known true/false-positive pair before switching (see
    docs/Business-Rules.md's BR-ACC-03) -- the false-positive cases (e.g.
    "Ramaiah Medical College Hospital" vs "Kmct Medical college Hospital")
    still score 0.0 under this formula, they just don't share any
    significant word once boilerplate is stripped.
    """
    query_tokens, candidate_tokens = _tokenize(query), _tokenize(candidate)
    if not query_tokens or not candidate_tokens:
        return 0.0

    used_candidate: set[int] = set()
    matched = 0
    for qt in query_tokens:
        best_ratio, best_j = 0.0, None
        for j, ct in enumerate(candidate_tokens):
            if j in used_candidate:
                continue
            ratio = SequenceMatcher(None, qt, ct).ratio()
            if ratio > best_ratio:
                best_ratio, best_j = ratio, j
        if best_ratio >= TOKEN_MATCH_RATIO:
            matched += 1
            used_candidate.add(best_j)

    return matched / len(query_tokens)
