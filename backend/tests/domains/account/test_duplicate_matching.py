from app.domains.account.duplicate_matching import score_query_containment


class TestScoreQueryContainment:
    def test_real_duplicate_scores_high(self):
        # Nishad's 2026-08-30 incident -- he typed the second name.
        score = score_query_containment(
            "Cooperative hos Cherpulassery", "EMS cooperative hospital Cherpulassery"
        )
        assert score >= 0.5

    def test_cross_zone_duplicate_scores_high(self):
        # The 2026-08-30 zone-hierarchy gap: same hospital, filed under a
        # parent zone vs its child zone -- this is a pure name-matching test,
        # zone scoping lives in the repository, not here. "al Shifa" is what
        # was typed against the existing "Al Shifa Hospital".
        score = score_query_containment("al Shifa", "Al Shifa Hospital")
        assert score >= 0.5

    def test_short_query_fully_contained_in_longer_real_name_scores_perfect(self):
        # The 2026-08-30 bug: a bare "Aster" failed to warn against any of
        # several real Aster-branded hospitals in the same zone, because the
        # old symmetric formula divided by the *longer* name's word count.
        # This is the fix -- a short query counts as a full match once every
        # word in it is covered by the candidate, regardless of how many
        # extra words the candidate has.
        assert score_query_containment("Aster", "Aster MIMS Calicut") == 1.0
        assert score_query_containment("Aster", "Aster MIMS Mother Hospital Areekode") == 1.0
        assert score_query_containment("Aster", "aster medicity") == 1.0

    def test_is_asymmetric_by_design(self):
        # Reversed, a short candidate does NOT inflate a long query's score --
        # this is deliberate (see the function's docstring), not a bug.
        assert score_query_containment("Aster MIMS Calicut", "Aster") < 1.0

    def test_different_hospitals_sharing_generic_words_score_low(self):
        # Real, unrelated hospitals -- must not fire despite sharing
        # "Medical College Hospital".
        score = score_query_containment(
            "Ramaiah Medical College Hospital", "Kmct Medical college Hospital"
        )
        assert score < 0.5

    def test_different_towns_sharing_brand_and_generic_words_scores_high(self):
        # Known tuning trade-off (see docs/Duplicate-Hospital-Decision-Brief-
        # 2026-08-29.md): these are two genuinely different real hospitals
        # (different towns, different reps), but sharing "EMS" + "cooperative"
        # while only the place name differs is still enough to cross the
        # warning threshold. Acceptable because the UX is a one-tap-dismiss
        # warning, not a hard block -- erring toward catching more real
        # duplicates costs an occasional easy false alarm, not a blocked save.
        score = score_query_containment(
            "EMS cooperative hospital Cherpulassery", "EMS Coperative Hospital Perambra"
        )
        assert score >= 0.5

    def test_identical_significant_words_scores_perfect(self):
        score = score_query_containment(
            "Aster Mims Mother Areekode", "Aster MIMS Mother Hospital Areekode"
        )
        assert score == 1.0

    def test_all_stopword_query_does_not_match_unrelated_hospital(self):
        assert score_query_containment("Hospital", "Some Real Hospital") == 0.0

    def test_generic_institutional_word_alone_does_not_match_unrelated_hospital(self):
        # "Trust" is itself a stopword (generic institutional wording), so
        # "MEDICAL TRUST HOSPITAL" falls back to its raw tokens once every
        # word strips out -- must not falsely match "Trust well Hospital",
        # a different real hospital that only shares that one generic word.
        score = score_query_containment("MEDICAL TRUST HOSPITAL", "Trust well Hospital")
        assert score < 0.5
