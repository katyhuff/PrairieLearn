-- BLOCK get_questions
SELECT
    iq.*,
    ((lag(z.id) OVER w) IS DISTINCT FROM z.id) AS start_new_zone,
    z.id AS zone_id,
    z.title AS zone_title,
    q.title AS question_title,
    aq.max_points,
    CASE
        WHEN iq.open THEN
            iq.points_list[(iq.number_attempts + 2):array_length(iq.points_list, 1)]
        ELSE NULL
    END AS remaining_points,
    qo.row_order,
    qo.question_number
FROM
    instance_questions AS iq
    JOIN assessment_questions AS aq ON (aq.id = iq.assessment_question_id)
    JOIN alternative_groups AS ag ON (ag.id = aq.alternative_group_id)
    JOIN zones AS z ON (z.id = ag.zone_id)
    JOIN questions AS q ON (q.id = aq.question_id)
    JOIN question_order($assessment_instance_id) AS qo ON (iq.id = qo.instance_question_id)
WHERE
    iq.assessment_instance_id = $assessment_instance_id
WINDOW
    w AS (ORDER BY qo.row_order)
ORDER BY qo.row_order;

-- BLOCK tmp_upgrade_iq_status
UPDATE instance_questions AS iq
SET
    status = exam_question_status(iq)::enum_instance_question_status
WHERE
    iq.assessment_instance_id = $assessment_instance_id;

-- BLOCK tmp_set_upgraded
UPDATE assessment_instances AS ai
SET
    tmp_upgraded_iq_status = TRUE
WHERE
    ai.id = $assessment_instance_id;
