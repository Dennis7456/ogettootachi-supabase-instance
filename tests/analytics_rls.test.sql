-- pgTAP test: anonymous inserts allowed on analytics tables
BEGIN;
SET LOCAL ROLE anon;
SELECT plan(4);

INSERT INTO analytics_pageviews (session_id, page_url) VALUES ('s', '/');
SELECT ok(true, 'insert pageviews');

INSERT INTO analytics_time_on_page (session_id, page_url, time_spent) VALUES ('s','/',1);
SELECT ok(true, 'insert time_on_page');

INSERT INTO analytics_conversions (session_id, event_type, page_url) VALUES ('s','event','/');
SELECT ok(true, 'insert conversions');

INSERT INTO analytics_chatbot (session_id, page_url) VALUES ('s','/chat');
SELECT ok(true, 'insert chatbot');

SELECT finish();
ROLLBACK;
