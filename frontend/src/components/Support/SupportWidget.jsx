import React, { useState, useEffect, useRef } from 'react';
import '../../styles/SupportWidget.css';
import { getFAQs, sendChatMessage } from '../../utils/api';
import { motion, AnimatePresence } from 'framer-motion';

const SupportWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('faq');
  const [faqs, setFaqs] = useState([]);
  const [activeFaq, setActiveFaq] = useState(null);
  const [chatMessages, setChatMessages] = useState([
    { text: "Hi! How can I help you today?", isBot: true }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (isOpen && activeTab === 'faq' && faqs.length === 0) {
      fetchFaqs();
    }
  }, [isOpen, activeTab, faqs.length]);

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages]);

  const fetchFaqs = async () => {
    try {
      const data = await getFAQs();
      setFaqs(data);
    } catch (error) {
      console.error("Failed to fetch FAQs", error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const userMessage = inputValue.trim();
    setChatMessages(prev => [...prev, { text: userMessage, isBot: false }]);
    setInputValue('');
    setIsLoading(true);

    try {
      const data = await sendChatMessage(userMessage);
      setChatMessages(prev => [...prev, { text: data.response, isBot: true }]);
    } catch {
      setChatMessages(prev => [...prev, { text: "Sorry, I'm having trouble connecting right now.", isBot: true }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="support-widget-container">
      <motion.button 
        className={`support-toggle-btn ${isOpen ? 'active' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        title="Support"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        <AnimatePresence mode="wait">
          <motion.span
            key={isOpen ? 'close' : 'open'}
            initial={{ opacity: 0, rotate: -45 }}
            animate={{ opacity: 1, rotate: 0 }}
            exit={{ opacity: 0, rotate: 45 }}
            transition={{ duration: 0.2 }}
          >
            {isOpen ? '✕' : '💬'}
          </motion.span>
        </AnimatePresence>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            className="support-window open"
            initial={{ opacity: 0, scale: 0.8, y: 20, transformOrigin: 'bottom right' }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
          >
            <div className="support-header">
              <h3>Aurelle Support</h3>
            </div>

            <div className="support-tabs">
              <button 
                className={`support-tab ${activeTab === 'faq' ? 'active' : ''}`}
                onClick={() => setActiveTab('faq')}
              >
                FAQs
                {activeTab === 'faq' && <motion.div layoutId="tab-underline" className="tab-underline" />}
              </button>
              <button 
                className={`support-tab ${activeTab === 'chat' ? 'active' : ''}`}
                onClick={() => setActiveTab('chat')}
              >
                Chatbot
                {activeTab === 'chat' && <motion.div layoutId="tab-underline" className="tab-underline" />}
              </button>
            </div>

            <div className="support-content">
              <AnimatePresence mode="wait">
                {activeTab === 'faq' ? (
                  <motion.div 
                    key="faq"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    className="faq-list"
                  >
                    {faqs.length > 0 ? (
                      faqs.map((faq, index) => (
                        <div 
                          key={faq.id || index} 
                          className={`faq-item ${activeFaq === index ? 'active' : ''}`}
                        >
                          <button 
                            className="faq-question"
                            onClick={() => setActiveFaq(activeFaq === index ? null : index)}
                          >
                            {faq.question}
                            <motion.span
                              animate={{ rotate: activeFaq === index ? 180 : 0 }}
                            >
                              {activeFaq === index ? '−' : '+'}
                            </motion.span>
                          </button>
                          <AnimatePresence>
                            {activeFaq === index && (
                              <motion.div 
                                className="faq-answer"
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                style={{ overflow: 'hidden' }}
                              >
                                <div style={{ padding: '10px 0' }}>
                                  {faq.answer}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      ))
                    ) : (
                      <p>Loading FAQs...</p>
                    )}
                  </motion.div>
                ) : (
                  <motion.div 
                    key="chat"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="chat-container"
                  >
                    <div className="chat-messages">
                      {chatMessages.map((msg, index) => (
                        <motion.div 
                          key={index} 
                          initial={{ opacity: 0, y: 10, scale: 0.9 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          className={`message ${msg.isBot ? 'bot' : 'user'}`}
                        >
                          {msg.text}
                        </motion.div>
                      ))}
                      <div ref={messagesEndRef} />
                    </div>
                    <form className="chat-input-area" onSubmit={handleSendMessage}>
                      <input 
                        type="text" 
                        placeholder="Ask a question..." 
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        disabled={isLoading}
                      />
                      <button type="submit" className="chat-send-btn" disabled={isLoading || !inputValue.trim()}>
                        {isLoading ? '...' : 'Send'}
                      </button>
                    </form>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SupportWidget;
