// File: src/components/ai/AIAssistant.tsx
// Main AI assistant chat interface

import React, { useState, useRef, useEffect } from 'react';
import {
  MessageCircle,
  Send,
  Bot,
  User,
  Settings,
  X,
  Loader2,
  ChevronDown,
  Sparkles
} from 'lucide-react';
import { useAIAssistant } from '../../hooks/useAIAssistant';
import { AIAssistant as AIAssistantType, AIMessage, UserRole } from '../../types/ai';
import AssistantSelector from './AssistantSelector';

interface AIAssistantProps {
  userId: string;
  currentUserRole: UserRole;
  devotionalContext?: any;
  onClose?: () => void;
  isModal?: boolean;
}

const AIAssistant: React.FC<AIAssistantProps> = ({
  userId,
  currentUserRole,
  devotionalContext,
  onClose,
  isModal = false
}) => {
  const [input, setInput] = useState('');
  const [showAssistantSelector, setShowAssistantSelector] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    chatState,
    preferences,
    availableAssistants,
    startConversation,
    sendMessage,
    clearConversation,
    canSendMessage
  } = useAIAssistant(userId);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatState.messages]);

  // Focus input when conversation starts
  useEffect(() => {
    if (chatState.conversation && !chatState.isLoading) {
      inputRef.current?.focus();
    }
  }, [chatState.conversation, chatState.isLoading]);

  const handleAssistantSelect = async (assistant: AIAssistantType) => {
    try {
      await startConversation(
        assistant.id,
        `Chat with ${assistant.name}`,
        devotionalContext
      );
      setShowAssistantSelector(false);
    } catch (error) {
      console.error('Error starting conversation:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim() || !canSendMessage) return;

    const message = input.trim
