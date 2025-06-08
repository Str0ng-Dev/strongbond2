/*
  # Sample Data for Devotional Application

  1. Sample Data Insertion
    - Insert sample users first (to satisfy foreign key constraints)
    - Insert devotional marketplace entries
    - Insert devotional content for sample plans
    - Insert mentor content for different user roles
    - Insert fitness challenges
    - Insert sample groups and memberships
    - Insert sample user devotional plans and journal entries

  2. Data Structure
    - 6 devotional plans with varied pricing
    - 10 days of content for "Walking with Purpose"
    - Role-specific mentor content
    - Fitness challenges with 3 difficulty levels
    - Sample groups and user relationships
*/

-- Insert sample users first (to satisfy foreign key constraints)
INSERT INTO users (id, first_name, user_role, fitness_enabled, created_at) VALUES
  ('770e8400-e29b-41d4-a716-446655440001', 'John', 'Dad', true, now()),
  ('770e8400-e29b-41d4-a716-446655440002', 'Pastor David', 'Church Leader', false, now()),
  ('770e8400-e29b-41d4-a716-446655440003', 'Sarah', 'Single Woman', true, now()),
  ('770e8400-e29b-41d4-a716-446655440004', 'Mary', 'Mom', true, now()),
  ('770e8400-e29b-41d4-a716-446655440005', 'Michael', 'Son', true, now()),
  ('770e8400-e29b-41d4-a716-446655440006', 'Coach Ryan', 'Coach', true, now());

-- Insert sample devotional marketplace entries
INSERT INTO devotional_marketplace (id, title, author, description, price_type, price, image_url, tags, duration_days) VALUES
  ('550e8400-e29b-41d4-a716-446655440001', 'Walking with Purpose', 'Sarah Johnson', 'Discover your divine purpose through daily reflections and scripture.', 'free', NULL, 'https://images.pexels.com/photos/1000445/pexels-photo-1000445.jpeg?auto=compress&cs=tinysrgb&w=400', ARRAY['Faith', 'Purpose', 'Growth'], 30),
  ('550e8400-e29b-41d4-a716-446655440002', 'Strength in Adversity', 'Pastor Michael Davis', 'Find strength and hope during life''s most challenging moments.', 'donation', NULL, 'https://images.pexels.com/photos/1624438/pexels-photo-1624438.jpeg?auto=compress&cs=tinysrgb&w=400', ARRAY['Strength', 'Perseverance', 'Hope'], 21),
  ('550e8400-e29b-41d4-a716-446655440003', 'Family Foundations', 'Dr. Lisa Thompson', 'Build stronger family bonds through faith-centered principles.', 'paid', 19.99, 'https://images.pexels.com/photos/1128318/pexels-photo-1128318.jpeg?auto=compress&cs=tinysrgb&w=400', ARRAY['Family', 'Relationships', 'Love'], 40),
  ('550e8400-e29b-41d4-a716-446655440004', 'Young Warriors', 'Coach Ryan Miller', 'Empowering young people to discover their identity in Christ.', 'free', NULL, 'https://images.pexels.com/photos/1181406/pexels-photo-1181406.jpeg?auto=compress&cs=tinysrgb&w=400', ARRAY['Youth', 'Courage', 'Identity'], 14),
  ('550e8400-e29b-41d4-a716-446655440005', 'Leadership Excellence', 'Rev. David Wilson', 'Develop Christ-centered leadership skills for ministry and life.', 'paid', 29.99, 'https://images.pexels.com/photos/1181677/pexels-photo-1181677.jpeg?auto=compress&cs=tinysrgb&w=400', ARRAY['Leadership', 'Service', 'Wisdom'], 35),
  ('550e8400-e29b-41d4-a716-446655440006', 'Grace & Gratitude', 'Maria Rodriguez', 'Cultivate a heart of gratitude and experience God''s amazing grace.', 'donation', NULL, 'https://images.pexels.com/photos/1624496/pexels-photo-1624496.jpeg?auto=compress&cs=tinysrgb&w=400', ARRAY['Grace', 'Gratitude', 'Joy'], 28);

-- Insert sample devotional content for "Walking with Purpose" (first 10 days)
INSERT INTO devotionals (devotional_plan_id, day_number, title, scripture, content) VALUES
  ('550e8400-e29b-41d4-a716-446655440001', 1, 'Beginning Your Journey', 'Trust in the Lord with all your heart and lean not on your own understanding; in all your ways submit to him, and he will make your paths straight. - Proverbs 3:5-6', 'Welcome to this journey of discovering your divine purpose. Today marks the beginning of a transformative experience where you''ll explore God''s unique calling on your life. Take time to surrender your plans and trust in His perfect timing.'),
  ('550e8400-e29b-41d4-a716-446655440001', 2, 'Created with Intention', 'For we are God''s handiwork, created in Christ Jesus to do good works, which God prepared in advance for us to do. - Ephesians 2:10', 'You are not an accident. God created you with specific gifts, talents, and passions for a reason. Today, reflect on the unique qualities He has given you and how they might be used for His glory.'),
  ('550e8400-e29b-41d4-a716-446655440001', 3, 'Listening for His Voice', 'Whether you turn to the right or to the left, your ears will hear a voice behind you, saying, "This is the way; walk in it." - Isaiah 30:21', 'God speaks to us in many ways - through His Word, prayer, circumstances, and the counsel of others. Practice listening for His voice today and be open to His guidance.'),
  ('550e8400-e29b-41d4-a716-446655440001', 4, 'Overcoming Fear', 'Have I not commanded you? Be strong and courageous. Do not be afraid; do not be discouraged, for the Lord your God will be with you wherever you go. - Joshua 1:9', 'Fear often holds us back from pursuing God''s calling. Remember that courage isn''t the absence of fear, but moving forward despite it, knowing God is with you.'),
  ('550e8400-e29b-41d4-a716-446655440001', 5, 'Using Your Gifts', 'Each of you should use whatever gift you have to serve others, as faithful stewards of God''s grace in its various forms. - 1 Peter 4:10', 'God has given you unique gifts not for your own benefit alone, but to serve others and build His kingdom. Consider how you can use your talents to make a difference.'),
  ('550e8400-e29b-41d4-a716-446655440001', 6, 'Patience in the Process', 'But those who hope in the Lord will renew their strength. They will soar on wings like eagles; they will run and not grow weary, they will walk and not be faint. - Isaiah 40:31', 'Discovering your purpose is often a gradual process. Be patient with yourself and trust God''s timing. He is preparing you for something beautiful.'),
  ('550e8400-e29b-41d4-a716-446655440001', 7, 'Discovering Your Divine Calling', 'For I know the plans I have for you," declares the Lord, "plans to prosper you and not to harm you, to give you hope and a future. - Jeremiah 29:11', 'Today we explore the beautiful truth that God has a unique purpose for each of our lives. Your calling isn''t just about what you do for work, but about how you can serve others and glorify God in every aspect of your life.'),
  ('550e8400-e29b-41d4-a716-446655440001', 8, 'Walking in Obedience', 'If you love me, keep my commands. - John 14:15', 'True purpose is found in obedience to God''s will. Sometimes this means stepping out of your comfort zone or making difficult choices. Trust that His ways are always best.'),
  ('550e8400-e29b-41d4-a716-446655440001', 9, 'Community and Calling', 'As iron sharpens iron, so one person sharpens another. - Proverbs 27:17', 'God often reveals and refines our purpose through community. Surround yourself with people who encourage your faith and challenge you to grow.'),
  ('550e8400-e29b-41d4-a716-446655440001', 10, 'Making a Difference', 'Let your light shine before others, that they may see your good deeds and glorify your Father in heaven. - Matthew 5:16', 'Your purpose is ultimately about bringing glory to God and blessing others. Look for opportunities today to let your light shine in your sphere of influence.');

-- Insert mentor content for different roles (Day 7 example)
INSERT INTO mentor_content (devotional_id, day_number, user_role, title, content, video_url) VALUES
  ('550e8400-e29b-41d4-a716-446655440001', 7, 'Dad', 'Father''s Wisdom Corner', 'As fathers, we''re called to lead our families with love, patience, and godly wisdom. Today''s devotional reminds us that our purpose extends beyond providing - we''re called to nurture, guide, and model Christ''s love in our homes.', 'https://example.com/dad-video-day7'),
  ('550e8400-e29b-41d4-a716-446655440001', 7, 'Mom', 'Mother''s Heart Corner', 'Mothers have the incredible privilege of shaping hearts and minds. Your nurturing spirit reflects God''s love in powerful ways. Remember that your daily acts of love and service are part of your divine calling.', 'https://example.com/mom-video-day7'),
  ('550e8400-e29b-41d4-a716-446655440001', 7, 'Son', 'Young Man''s Path', 'God has great plans for your life! As you grow in faith and character, remember that true strength comes from following Christ. Your generation has unique opportunities to make a difference in this world.', 'https://example.com/son-video-day7'),
  ('550e8400-e29b-41d4-a716-446655440001', 7, 'Daughter', 'Young Woman''s Journey', 'You are fearfully and wonderfully made! God has equipped you with unique gifts and a special purpose. Trust in His plan for your life and don''t be afraid to step boldly into the calling He has for you.', 'https://example.com/daughter-video-day7'),
  ('550e8400-e29b-41d4-a716-446655440001', 7, 'Single Man', 'Single Man''s Purpose', 'Your singleness is not a waiting period - it''s a season of purpose! Use this time to grow in your relationship with God and serve others. Your unique perspective and availability are gifts to the kingdom.', 'https://example.com/single-man-video-day7'),
  ('550e8400-e29b-41d4-a716-446655440001', 7, 'Single Woman', 'Single Woman''s Calling', 'God has amazing plans for your life! Whether in singleness or future relationships, your identity is secure in Christ. Embrace this season to discover and develop the gifts God has given you.', 'https://example.com/single-woman-video-day7'),
  ('550e8400-e29b-41d4-a716-446655440001', 7, 'Church Leader', 'Leadership Insights', 'Leading God''s people is both a privilege and a responsibility. Today''s message about purpose reminds us that our leadership should always point others to Christ and help them discover their own calling in His kingdom.', 'https://example.com/leader-video-day7'),
  ('550e8400-e29b-41d4-a716-446655440001', 7, 'Coach', 'Coach''s Corner', 'As coaches, we have the unique opportunity to develop both physical abilities and character. Your role in shaping young lives goes far beyond the game - you''re helping them discover their potential and purpose.', 'https://example.com/coach-video-day7');

-- Insert fitness challenges for Day 7
INSERT INTO fitness_challenges (devotional_id, day_number, title, description, duration, difficulty, strong_variation, stronger_variation, strongest_variation) VALUES
  ('550e8400-e29b-41d4-a716-446655440001', 7, 'Temple Care Challenge', 'Honor your body as God''s temple with this balanced workout focusing on strength and flexibility', '20 minutes', 'Medium', 
   'Beginner: 10 push-ups, 15 squats, 30-second plank, 10 lunges per leg. Rest 1 minute between exercises. Repeat 2 rounds.',
   'Intermediate: 15 push-ups, 20 squats, 45-second plank, 15 lunges per leg. Rest 45 seconds between exercises. Repeat 3 rounds.',
   'Advanced: 20 push-ups, 25 squats, 60-second plank, 20 lunges per leg. Rest 30 seconds between exercises. Repeat 4 rounds.');

-- Insert more fitness challenges for variety
INSERT INTO fitness_challenges (devotional_id, day_number, title, description, duration, difficulty, strong_variation, stronger_variation, strongest_variation) VALUES
  ('550e8400-e29b-41d4-a716-446655440001', 1, 'New Beginning Workout', 'Start your journey with gentle movement and stretching', '15 minutes', 'Easy',
   'Beginner: 5-minute walk, basic stretches, deep breathing exercises',
   'Intermediate: 10-minute walk, dynamic stretches, light bodyweight exercises',
   'Advanced: 15-minute jog, full body stretches, core activation exercises'),
  ('550e8400-e29b-41d4-a716-446655440001', 3, 'Listening Heart Cardio', 'Cardio workout to clear your mind and open your heart to God''s voice', '25 minutes', 'Medium',
   'Beginner: 20-minute walk with prayer, gentle stretching',
   'Intermediate: 15-minute walk/jog intervals, bodyweight circuit',
   'Advanced: 25-minute run with prayer, high-intensity intervals');

-- Insert sample groups (now that users exist)
INSERT INTO groups (id, name, created_by_user_id) VALUES
  ('660e8400-e29b-41d4-a716-446655440001', 'Johnson Family', '770e8400-e29b-41d4-a716-446655440001'),
  ('660e8400-e29b-41d4-a716-446655440002', 'Grace Community Church', '770e8400-e29b-41d4-a716-446655440002'),
  ('660e8400-e29b-41d4-a716-446655440003', 'Young Adults Group', '770e8400-e29b-41d4-a716-446655440003');

-- Insert group memberships
INSERT INTO group_members (group_id, user_id, is_admin) VALUES
  ('660e8400-e29b-41d4-a716-446655440001', '770e8400-e29b-41d4-a716-446655440001', true),
  ('660e8400-e29b-41d4-a716-446655440001', '770e8400-e29b-41d4-a716-446655440004', false),
  ('660e8400-e29b-41d4-a716-446655440001', '770e8400-e29b-41d4-a716-446655440005', false),
  ('660e8400-e29b-41d4-a716-446655440002', '770e8400-e29b-41d4-a716-446655440002', true),
  ('660e8400-e29b-41d4-a716-446655440002', '770e8400-e29b-41d4-a716-446655440006', false),
  ('660e8400-e29b-41d4-a716-446655440003', '770e8400-e29b-41d4-a716-446655440003', true);

-- Update users with their group assignments
UPDATE users SET group_id = '660e8400-e29b-41d4-a716-446655440001' WHERE id IN ('770e8400-e29b-41d4-a716-446655440001', '770e8400-e29b-41d4-a716-446655440004', '770e8400-e29b-41d4-a716-446655440005');
UPDATE users SET group_id = '660e8400-e29b-41d4-a716-446655440002' WHERE id IN ('770e8400-e29b-41d4-a716-446655440002', '770e8400-e29b-41d4-a716-446655440006');
UPDATE users SET group_id = '660e8400-e29b-41d4-a716-446655440003' WHERE id = '770e8400-e29b-41d4-a716-446655440003';

-- Insert sample user devotional plans
INSERT INTO user_devotional_plan (user_id, devotional_id, start_date, current_day) VALUES
  ('770e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', '2024-01-15', 7),
  ('770e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440001', '2024-01-20', 3),
  ('770e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440002', '2024-01-10', 12);

-- Insert sample journal entries
INSERT INTO journal_entries (user_id, devotional_id, day_number, entry_text, is_shared, emotion_tag) VALUES
  ('770e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', 6, 'Today''s message about patience really spoke to me. I''ve been rushing to figure out my next steps, but God is reminding me to trust His timing. I feel more peaceful knowing He''s preparing something good.', true, 'peaceful'),
  ('770e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440001', 2, 'It''s amazing to think that God created me with specific gifts and purposes. I''m starting to see how my love for helping others might be part of His plan for my life.', false, 'hopeful'),
  ('770e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440002', 10, 'This devotional series has been exactly what I needed during this difficult season. I''m learning that strength doesn''t mean having it all together - it means trusting God when everything feels uncertain.', true, 'grateful');