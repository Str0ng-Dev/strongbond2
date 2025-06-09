import React from 'react';
import { Bot, User } from 'lucide-react';
import { Message } from '../hooks/useConversations';
import { Assistant } from '../hooks/useAssistants';

interface MessageListProps {
  messages: Message[];
  selectedAssistant: Assistant | null;
  isLoading: boolean;
}

const MessageList: React.FC<MessageListProps> = ({
  messages,
  selectedAssistant,
  isLoading
}) => {
  return (
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
              message.sender === 'user' ? 'bg-blue-500' : selectedAssistant?.color || 'bg-gray-500'
            }`}>
              {message.sender === 'user' ?
                <User className="w-4 h-4 text-white" /> :
                selectedAssistant ? React.createElement(selectedAssistant.icon, { className: "w-4 h-4 text-white" }) :
                <Bot className="w-4 h-4 text-white" />
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
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${selectedAssistant?.color || 'bg-gray-500'}`}>
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
  );
};

export default MessageList;
