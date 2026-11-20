import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../lib/api.js';

export default function QuizTake() {
  const { id } = useParams();
  const [quiz, setQuiz] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState([]);
  const [result, setResult] = useState(null);

  useEffect(() => {
    api.get(`/quizzes/${id}`).then(r => {
      setQuiz(r.data.quiz);
      setQuestions(r.data.questions || []);
      setAnswers(new Array((r.data.questions||[]).length).fill(-1));
    });
  }, [id]);

  const submit = async () => {
    const r = await api.post(`/quizzes/${id}/attempt`, { answers });
    setResult(r.data);
  };

  if (!quiz) return <div className="max-w-4xl mx-auto px-4 py-8">Loading...</div>;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-4">
      <h1 className="text-2xl font-extrabold text-slate-900 font-display">{quiz.title}</h1>
      <p className="text-sm text-slate-500">{quiz.description}</p>
      {questions.map((q, qi) => (
        <div key={q.id} className="bg-white rounded-2xl p-5 border border-slate-200 card-soft-shadow">
          <div className="font-semibold text-slate-800 mb-3">{qi+1}. {q.question_text}</div>
          <div className="space-y-2">
            {(q.options || []).map((opt, oi) => (
              <label key={oi} className={`flex items-center space-x-2 p-2 rounded-lg border cursor-pointer ${answers[qi]===oi ? 'border-cyan-500 bg-cyan-50' : 'border-slate-200'}`}>
                <input type="radio" name={`q${qi}`} checked={answers[qi]===oi} onChange={() => { const a=[...answers]; a[qi]=oi; setAnswers(a); }} />
                <span className="text-sm">{opt}</span>
              </label>
            ))}
          </div>
        </div>
      ))}
      {!result && (
        <button onClick={submit} className="px-5 py-2.5 rounded-full text-sm font-semibold text-white bg-gradient-to-r from-cyan-600 to-teal-500">Submit</button>
      )}
      {result && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 text-emerald-800">
          Score: {result.score} / {result.total} ({Math.round(result.percentage)}%)
          <div className="mt-2"><Link to="/quizzes" className="text-cyan-600 hover:underline text-sm">Back to quizzes</Link></div>
        </div>
      )}
    </div>
  );
}