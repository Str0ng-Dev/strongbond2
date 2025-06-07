import { DevotionalPlan, CurrentPlan, TodayContent, FitnessChallenge } from '../types';

export const devotionalPlans: DevotionalPlan[] = [
  {
    id: '550e8400-e29b-41d4-a716-446655440001',
    title: 'Walking with Purpose',
    image: 'https://images.pexels.com/photos/1000445/pexels-photo-1000445.jpeg?auto=compress&cs=tinysrgb&w=400',
    author: 'Sarah Johnson',
    price_type: 'free',
    tags: ['Faith', 'Purpose', 'Growth'],
    description: 'Discover your divine purpose through daily reflections and scripture.',
    duration_days: 30,
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440002',
    title: 'Strength in Adversity',
    image: 'https://images.pexels.com/photos/1624438/pexels-photo-1624438.jpeg?auto=compress&cs=tinysrgb&w=400',
    author: 'Pastor Michael Davis',
    price_type: 'donation',
    tags: ['Strength', 'Perseverance', 'Hope'],
    description: 'Find strength and hope during life\'s most challenging moments.',
    duration_days: 21,
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440003',
    title: 'Family Foundations',
    image: 'https://images.pexels.com/photos/1128318/pexels-photo-1128318.jpeg?auto=compress&cs=tinysrgb&w=400',
    author: 'Dr. Lisa Thompson',
    price_type: 'paid',
    tags: ['Family', 'Relationships', 'Love'],
    description: 'Build stronger family bonds through faith-centered principles.',
    duration_days: 40,
    price: 19.99,
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440004',
    title: 'Young Warriors',
    image: 'https://images.pexels.com/photos/1181406/pexels-photo-1181406.jpeg?auto=compress&cs=tinysrgb&w=400',
    author: 'Coach Ryan Miller',
    price_type: 'free',
    tags: ['Youth', 'Courage', 'Identity'],
    description: 'Empowering young people to discover their identity in Christ.',
    duration_days: 14,
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440005',
    title: 'Leadership Excellence',
    image: 'https://images.pexels.com/photos/1181677/pexels-photo-1181677.jpeg?auto=compress&cs=tinysrgb&w=400',
    author: 'Rev. David Wilson',
    price_type: 'paid',
    tags: ['Leadership', 'Service', 'Wisdom'],
    description: 'Develop Christ-centered leadership skills for ministry and life.',
    duration_days: 35,
    price: 29.99,
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440006',
    title: 'Grace & Gratitude',
    image: 'https://images.pexels.com/photos/1624496/pexels-photo-1624496.jpeg?auto=compress&cs=tinysrgb&w=400',
    author: 'Maria Rodriguez',
    price_type: 'donation',
    tags: ['Grace', 'Gratitude', 'Joy'],
    description: 'Cultivate a heart of gratitude and experience God\'s amazing grace.',
    duration_days: 28,
  },
];

export const currentPlan: CurrentPlan = {
  id: 'current-550e8400-e29b-41d4-a716-446655440001',
  plan_id: '550e8400-e29b-41d4-a716-446655440001',
  title: 'Walking with Purpose',
  current_day: 7,
  total_days: 30,
  started_date: '2024-01-15',
};

export const todayContent: TodayContent = {
  title: 'Discovering Your Divine Calling',
  scripture: 'For I know the plans I have for you," declares the Lord, "plans to prosper you and not to harm you, to give you hope and a future. - Jeremiah 29:11',
  body: 'Today we explore the beautiful truth that God has a unique purpose for each of our lives. Your calling isn\'t just about what you do for work, but about how you can serve others and glorify God in every aspect of your life. Take time today to reflect on the gifts and passions God has placed in your heart. How might He be calling you to use these for His kingdom? Remember, your purpose may unfold gradually, and that\'s perfectly okay. Trust in His timing and remain open to His leading.',
  day: 7,
};

export const fitnessChallenge: FitnessChallenge = {
  title: 'Temple Care Challenge',
  description: '20-minute morning workout focusing on strength and flexibility',
  duration: '20 minutes',
  difficulty: 'Medium',
};

export const mentorContent = {
  Dad: {
    title: "Father's Wisdom Corner",
    content: "As fathers, we're called to lead our families with love, patience, and godly wisdom. Today's devotional reminds us that our purpose extends beyond providing - we're called to nurture, guide, and model Christ's love in our homes.",
  },
  Mom: {
    title: "Mother's Heart Corner",
    content: "Mothers have the incredible privilege of shaping hearts and minds. Your nurturing spirit reflects God's love in powerful ways. Remember that your daily acts of love and service are part of your divine calling.",
  },
  Son: {
    title: "Young Man's Path",
    content: "God has great plans for your life! As you grow in faith and character, remember that true strength comes from following Christ. Your generation has unique opportunities to make a difference in this world.",
  },
  Daughter: {
    title: "Young Woman's Journey",
    content: "You are fearfully and wonderfully made! God has equipped you with unique gifts and a special purpose. Trust in His plan for your life and don't be afraid to step boldly into the calling He has for you.",
  },
  'Single Man': {
    title: "Single Man's Purpose",
    content: "Your singleness is not a waiting period - it's a season of purpose! Use this time to grow in your relationship with God and serve others. Your unique perspective and availability are gifts to the kingdom.",
  },
  'Single Woman': {
    title: "Single Woman's Calling",
    content: "God has amazing plans for your life! Whether in singleness or future relationships, your identity is secure in Christ. Embrace this season to discover and develop the gifts God has given you.",
  },
  'Church Leader': {
    title: "Leadership Insights",
    content: "Leading God's people is both a privilege and a responsibility. Today's message about purpose reminds us that our leadership should always point others to Christ and help them discover their own calling in His kingdom.",
  },
  Coach: {
    title: "Coach's Corner",
    content: "As coaches, we have the unique opportunity to develop both physical abilities and character. Your role in shaping young lives goes far beyond the game - you're helping them discover their potential and purpose.",
  },
};