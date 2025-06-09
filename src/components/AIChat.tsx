// File: src/components/AIChat.tsx
// Simple AI chat interface for testing Edge Functions

import React, { useState } from 'react';
import { Send, Bot, User, Heart, Book, Zap, Crown } from 'lucide-react';
import { UserRole } from '../types/ai';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  role?: UserRole;
}

interface Assistant {
  id: string;
  name: string;
  role: UserRole;
  icon: React.ComponentType<any>;
  color: string;
  description: string;
}

const mockAssistants: Assistant[] = [
  {
    id: '1',
    name: 'Dad',
    role: 'Dad',
    icon: Crown,
    color: 'bg-blue-500',
    description: 'Wise father figure and spiritual mentor'
  },
  {
    id: '2',
    name: 'Mom',
    role: 'Mom',
    icon: Heart,
    color: 'bg-pink-500',
    description: 'Nurturing mother figure and guide'
  },
  {
    id: '3',
    name: 'Coach',
    role: 'Coach',
    icon: Zap,
    color: 'bg-green-500',
    description: 'Motivational coach and fitness guide'
  },
  {
    id: '4',
    name: 'Son',
    role: 'Son',
    icon: User,
    color: 'bg-purple-500',
    description: 'Peer companion and friend'
  }
];

const AIChat: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [selectedAssistant, setSelectedAssistant] = useState(mockAssistants[0]);
  const [isLoading, setIsLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'testing'>('testing');

  // Initialize with welcome message
  React.useEffect(() => {
    const welcomeMessage: Message = {
      id: 'welcome',
      content: `Hello! I'm ${selectedAssistant.name}, your ${selectedAssistant.description}. I'm here to support you on your spiritual journey. How can I help you today?`,
      sender: 'ai',
      timestamp: new Date(),
      role: selectedAssistant.role
    };
    setMessages([welcomeMessage]);

    // Simulate connection test
    setTimeout(() => {
      setConnectionStatus('disconnected'); // Will be 'connected' when Edge Function is ready
    }, 1000);
  }, [selectedAssistant]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: input,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // TODO: Replace with actual Edge Function call
      // const response = await aiService.sendMessage(conversationId, input);

      // Mock response for now
      await new Promise(resolve => setTimeout(resolve, 1500));

      const mockResponses = {
        'Dad': `As a father, I understand the challenges you're facing. God has given us wisdom through experience, and I want to share that with you. Remember, His strength is made perfect in our weakness.`,
        'Mom': `I hear your heart in those words, dear. God sees every tear and every joy. Let's explore this together with His love guiding us. Your feelings are so valid and important.`,
        'Coach': `That's the spirit! I love seeing someone ready to grow and take action. God has given you incredible potential - let's break this down and create some action steps to move forward!`,
        'Son': `Hey, I totally get what you're saying! Growing in faith has its challenges, but we're in this together. God has amazing plans for us, and I'm excited to see how He works in your life!`
      };

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: mockResponses[selectedAssistant.role as keyof typeof mockResponses] || `Thank you for sharing that with me. How can I support you further in your faith journey?`,
        sender: 'ai',
        timestamp: new Date(),
        role: selectedAssistant.role
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Send message failed:', error);
      const errorMessage: Message = {
        id: 'error-' + Date.now(),
        content: 'I apologize, but I encountered an issue. Please try again.',
        sender: 'ai',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const switchAssistant = (assistant: Assistant) => {
    setSelectedAssistant(assistant);
    setMessages([]); // Clear messages when switching
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b shadow-sm">
        <div className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Bot className="w-8 h-8 text-purple-600" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">StrongBond AI Assistants</h1>
                <p className="text-sm text-gray-600">Testing family role personalities</p>
              </div>
            </div>

            <div className={`px-3 py-1 rounded-full text-xs font-medium ${
              connectionStatus === 'connected' ? 'bg-green-100 text-green-700' :
              connectionStatus === 'disconnected' ? 'bg-red-100 text-red-700' :
              'bg-yellow-100 text-yellow-700'
            }`}>
              {connectionStatus === 'connected' ? '🟢 Edge Function Ready' :
               connectionStatus === 'disconnected' ? '🔴 Mock Mode' :
               '🟡 Testing...'}
            </div>
          </div>

          {/* Assistant Selector */}
          <div className="mt-4">
            <p className="text-sm font-medium text-gray-700 mb-2">Choose your spiritual companion:</p>
            <div className="flex space-x-2 overflow-x-auto">
              {mockAssistants.map((assistant) => {
                const IconComponent = assistant.icon;
                return (
                  <button
                    key={assistant.id}
                    onClick={() => switchAssistant(assistant)}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg border transition-all whitespace-nowrap ${
                      selectedAssistant.id === assistant.id
                        ? 'border-purple-500 bg-purple-50 text-purple-700'
                        : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                    }`}
                  >
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center ${assistant.color}`}>
                      <IconComponent className="w-4 h-4 text-white" />
                    </div>
                    <span className="font-medium">{assistant.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        {messages.map(message => (
          <div
            key={message.id}
            className={`flex mb-4 ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`flex items-start space-x-2 max-w-xs lg:max-w-md ${
              message.sender === 'user' ? 'flex-row-reverse space-x-reverse' : ''
            }`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                message.sender === 'user' ? 'bg-blue-500' : selectedAssistant.color
              }`}>
                {message.sender === 'user' ?
                  <User className="w-4 h-4 text-white" /> :
                  React.createElement(selectedAssistant.icon, { className: "w-4 h-4 text-white" })
                }
              </div>
              <div className={`p-3 rounded-lg ${
                message.sender === 'user'
                  ? 'bg-blue-500 text-white'
                  : 'bg-white text-gray-800 shadow-sm border'
              }`}>
                <p className="text-sm leading-relaxed">{message.content}</p>
                <p className={`text-xs mt-2 ${message.sender === 'user' ? 'text-blue-100' : 'text-gray-500'}`}>
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="flex items-start space-x-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${selectedAssistant.color}`}>
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="bg-white p-3 rounded-lg shadow-sm border">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="border-t bg-white p-4">
        <div className="flex space-x-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            placeholder={`Share your heart with ${selectedAssistant.name}...`}
            className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            disabled={isLoading}
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || isLoading}
            className="bg-purple-500 text-white p-2 rounded-lg hover:bg-purple-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>

        {connectionStatus === 'disconnected' && (
          <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-700">
              <strong>Demo Mode:</strong> Currently using mock responses. Deploy the Edge Function to enable real AI conversations with family personalities.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIChat;
