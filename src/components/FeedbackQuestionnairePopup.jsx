import React, { useEffect, useMemo, useState } from 'react';
import axios from '../utils/axiosConfig';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import './FeedbackQuestionnairePopup.css';

const STORAGE_KEY = 'ciis-feedback-dismissed';

const getId = value => {
  if (!value) return '';
  if (typeof value === 'object') return String(value._id || value.id || value.value || '');
  return String(value);
};

const loadDismissed = () => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  } catch {
    return {};
  }
};

const saveDismissed = value => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
};

const FeedbackQuestionnairePopup = () => {
  const { isAuthenticated, token, user } = useAuth();
  const { onNewNotification = () => () => {} } = useSocket();
  const [items, setItems] = useState([]);
  const [activeId, setActiveId] = useState('');
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [dismissed, setDismissed] = useState(loadDismissed());

  const fetchAssigned = async () => {
    if (!isAuthenticated || !token) {
      setItems([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const response = await axios.get('/feedback/assigned', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const list = Array.isArray(response.data?.data) ? response.data.data : [];
      const now = Date.now();
      const freshDismissed = Object.fromEntries(
        Object.entries(loadDismissed()).filter(([, expiry]) => Number(expiry || 0) > now)
      );

      if (Object.keys(freshDismissed).length !== Object.keys(dismissed).length) {
        setDismissed(freshDismissed);
        saveDismissed(freshDismissed);
      }

      const filtered = list.filter(item => !freshDismissed[getId(item._id)] && !freshDismissed[getId(item.id)]);
      setItems(filtered);
      setActiveId(current => {
        const next = filtered.find(item => getId(item._id || item.id) === current) || filtered[0];
        return next ? getId(next._id || next.id) : '';
      });
      setError('');
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to load feedback right now.');
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchAssigned();
    const timer = setInterval(() => {
      void fetchAssigned();
    }, 45000);

    const unsubscribe = onNewNotification((notification = {}) => {
      const type = String(notification?.type || notification?.data?.type || '').trim();
      const feedbackId = notification?.data?.feedbackId || notification?.data?.questionnaireId;
      if (type === 'feedback_questionnaire' || feedbackId) {
        void fetchAssigned();
      }
    });

    return () => {
      clearInterval(timer);
      unsubscribe?.();
    };
  }, [isAuthenticated, token]);

  const activeFeedback = useMemo(
    () => items.find(item => getId(item._id || item.id) === activeId) || items[0] || null,
    [items, activeId]
  );

  useEffect(() => {
    if (!activeFeedback) {
      setAnswers({});
      return;
    }

    const nextAnswers = {};
    (activeFeedback.questions || []).forEach(question => {
      nextAnswers[question._id] = question.type === 'multiple_choice' ? [] : '';
    });
    setAnswers(nextAnswers);
  }, [activeFeedback?._id]);

  const visibilityMessage = activeFeedback?.userNameVisibilityMessage ||
    (activeFeedback?.nameVisibility === 'anonymous'
      ? 'Your submission will be anonymous.'
      : 'Your name will be visible to the admin.');

  const updateAnswer = (questionId, value) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  const dismissFeedback = (questionnaireId) => {
    const next = {
      ...loadDismissed(),
      [questionnaireId]: Date.now() + 10 * 60 * 1000,
    };
    setDismissed(next);
    saveDismissed(next);
    setItems(prev => prev.filter(item => getId(item._id || item.id) !== questionnaireId));
    setActiveId(current => (current === questionnaireId ? '' : current));
  };

  const handleSubmit = async () => {
    if (!activeFeedback) return;

    const payloadAnswers = [];
    for (const question of activeFeedback.questions || []) {
      const currentValue = answers[question._id];
      const hasValue = !(currentValue === undefined || currentValue === null || currentValue === '' || (Array.isArray(currentValue) && currentValue.length === 0));
      if (question.required && !hasValue) {
        setError(`Please answer: ${question.label}`);
        return;
      }
      if (!hasValue) continue;
      payloadAnswers.push({
        questionId: question._id,
        value: currentValue,
      });
    }

    setSubmitting(true);
    setError('');
    try {
      await axios.post(
        `/feedback/questionnaires/${activeFeedback._id}/respond`,
        { answers: payloadAnswers },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setNotice('Feedback submitted successfully.');
      setItems(prev => prev.filter(item => getId(item._id || item.id) !== getId(activeFeedback._id || activeFeedback.id)));
      setActiveId('');
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not submit feedback.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isAuthenticated || !user || !activeFeedback) {
    return null;
  }

  return (
    <div className="FeedbackPopup-layer" role="dialog" aria-modal="true" aria-labelledby="feedback-popup-title">
      <div className="FeedbackPopup-backdrop" />
      <div className="FeedbackPopup-card">
        <div className="FeedbackPopup-header">
          <div>
            <p className="FeedbackPopup-eyebrow">Feedback / Questionnaire</p>
            <h2 id="feedback-popup-title">{activeFeedback.title}</h2>
            <p className="FeedbackPopup-subtitle">{activeFeedback.description || 'Please submit your response before continuing.'}</p>
          </div>
          <button className="FeedbackPopup-close" type="button" onClick={() => dismissFeedback(getId(activeFeedback._id || activeFeedback.id))}>
            Later
          </button>
        </div>

        <div className={`FeedbackPopup-visibility ${activeFeedback.nameVisibility === 'anonymous' ? 'anonymous' : 'visible'}`}>
          <strong>{activeFeedback.nameVisibility === 'anonymous' ? 'Anonymous mode' : 'Name visible'}</strong>
          <span>{visibilityMessage}</span>
        </div>

        <div className="FeedbackPopup-meta">
          <span>Target: {activeFeedback.targetSummary || activeFeedback.targetScope}</span>
          <span>Questions: {(activeFeedback.questions || []).length}</span>
        </div>

        {loading ? (
          <div className="FeedbackPopup-loading">Loading your feedback form...</div>
        ) : (
          <div className="FeedbackPopup-body">
            {(activeFeedback.questions || []).map((question, index) => (
              <section className="FeedbackPopup-question" key={question._id || index}>
                <div className="FeedbackPopup-question-head">
                  <h3>{index + 1}. {question.label}</h3>
                  {question.required && <span className="FeedbackPopup-required">Required</span>}
                </div>

                {(question.type === 'text' || question.type === 'number') && (
                  <input
                    type={question.type === 'number' ? 'number' : 'text'}
                    className="FeedbackPopup-input"
                    placeholder={question.placeholder || 'Type your answer'}
                    value={answers[question._id] || ''}
                    onChange={event => updateAnswer(question._id, question.type === 'number' ? event.target.value : event.target.value)}
                  />
                )}

                {question.type === 'textarea' && (
                  <textarea
                    className="FeedbackPopup-textarea"
                    placeholder={question.placeholder || 'Type your answer'}
                    value={answers[question._id] || ''}
                    onChange={event => updateAnswer(question._id, event.target.value)}
                    rows={4}
                  />
                )}

                {question.type === 'single_choice' && (
                  <div className="FeedbackPopup-options">
                    {(question.options || []).map(option => (
                      <label key={option} className="FeedbackPopup-option">
                        <input
                          type="radio"
                          name={`question-${question._id}`}
                          checked={answers[question._id] === option}
                          onChange={() => updateAnswer(question._id, option)}
                        />
                        <span>{option}</span>
                      </label>
                    ))}
                  </div>
                )}

                {question.type === 'multiple_choice' && (
                  <div className="FeedbackPopup-options">
                    {(question.options || []).map(option => {
                      const selected = Array.isArray(answers[question._id]) && answers[question._id].includes(option);
                      return (
                        <label key={option} className="FeedbackPopup-option">
                          <input
                            type="checkbox"
                            checked={selected}
                            onChange={event => {
                              const current = Array.isArray(answers[question._id]) ? answers[question._id] : [];
                              const next = event.target.checked
                                ? [...current, option]
                                : current.filter(item => item !== option);
                              updateAnswer(question._id, next);
                            }}
                          />
                          <span>{option}</span>
                        </label>
                      );
                    })}
                  </div>
                )}

                {question.type === 'rating' && (
                  <div className="FeedbackPopup-rating">
                    {Array.from({ length: question.maxRating || 5 }, (_, idx) => idx + 1).map(rating => (
                      <button
                        key={rating}
                        type="button"
                        className={`FeedbackPopup-rating-btn ${String(answers[question._id] || '') === String(rating) ? 'active' : ''}`}
                        onClick={() => updateAnswer(question._id, String(rating))}
                      >
                        {rating}
                      </button>
                    ))}
                  </div>
                )}
              </section>
            ))}
          </div>
        )}

        {error && <div className="FeedbackPopup-alert error">{error}</div>}
        {notice && <div className="FeedbackPopup-alert success">{notice}</div>}

        <div className="FeedbackPopup-footer">
          <button type="button" className="FeedbackPopup-secondary" onClick={() => dismissFeedback(getId(activeFeedback._id || activeFeedback.id))}>
            Remind me later
          </button>
          <button type="button" className="FeedbackPopup-primary" onClick={handleSubmit} disabled={submitting}>
            {submitting ? 'Submitting...' : 'Submit Feedback'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default FeedbackQuestionnairePopup;
