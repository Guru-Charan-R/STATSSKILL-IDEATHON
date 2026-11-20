import React from 'react';
import { Link } from 'react-router-dom';
import { useSettings } from '../context/SettingsContext.jsx';

const features = [
  ['Competency Gap Analysis', 'Radar view of 8 core statistical skills against role benchmarks.'],
  ['AI Chat Assistant', 'A tutor trained on MoSPI manuals that answers in plain language.'],
  ['Personalized Courses', 'Learning paths that adapt to your gaps and the tasks ahead.'],
  ['Interactive MCQ Quizzes', 'Timed quizzes with instant scoring and explanations.'],
  ['Offline Downloads', 'Full access to manuals and micro-courses for field visits with no network.'],
  ['Learning Library', 'Searchable manuals, codes, schedules, and past NSSO surveys.'],
  ['Progress Tracking', 'Longitudinal score trends and completion milestones at a glance.'],
  ['Task Readiness', 'Know if you are ready for a real assignment and what to learn first.'],
];

export default function Features() {
  const { t } = useSettings();
  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-extrabold text-slate-900 font-display mb-8">{t('featuresTitle')}</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {features.map(([t, d]) => (
          <div key={t} className="bg-white rounded-3xl p-6 border border-slate-100 card-soft-shadow">
            <h3 className="text-lg font-bold text-slate-900 mb-2">{t}</h3>
            <p className="text-sm text-slate-500 leading-relaxed">{d}</p>
          </div>
        ))}
      </div>
      <div className="mt-8 text-center">
        <Link to="/videos" className="inline-flex items-center px-5 py-2.5 rounded-full text-sm font-semibold text-white bg-gradient-to-r from-cyan-600 to-teal-500">Explore Video Library</Link>
      </div>
    </div>
  );
}