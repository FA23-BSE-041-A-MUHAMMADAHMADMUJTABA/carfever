import React from 'react';

export const HeartIcon = ({ filled }) => (
  <svg viewBox="0 0 20 20" fill={filled ? 'rgba(217,108,108,0.2)' : 'none'} stroke={filled ? 'var(--mm-red)' : 'var(--mm-silver)'} strokeWidth="1.5" style={{ width: '100%', height: '100%' }}>
    <path d="M10 17.5s-7-4.5-7-9A4 4 0 0 1 10 5.5 4 4 0 0 1 17 8.5c0 4.5-7 9-7 9z" />
  </svg>
);

export const SearchIcon = () => (
  <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="9" cy="9" r="6" /><path d="M14 14l4 4" />
  </svg>
);

export const PhoneIcon = () => (
  <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M3 3h4l2 5-2.5 1.5A11 11 0 0 0 11.5 14.5L13 12l5 2v4a1 1 0 0 1-1 1A16 16 0 0 1 2 4a1 1 0 0 1 1-1z" />
  </svg>
);

export const GridIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
    <rect x="1" y="1" width="6" height="6" rx="1" /><rect x="9" y="1" width="6" height="6" rx="1" />
    <rect x="1" y="9" width="6" height="6" rx="1" /><rect x="9" y="9" width="6" height="6" rx="1" />
  </svg>
);

export const ListIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
    <line x1="1" y1="3" x2="15" y2="3" /><line x1="1" y1="8" x2="15" y2="8" /><line x1="1" y1="13" x2="15" y2="13" />
  </svg>
);

export const BellIcon = () => (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M15 8a5 5 0 0 0-10 0c0 5-2 7-2 7h14s-2-2-2-7z" /><path d="M8.5 17a1.5 1.5 0 0 0 3 0" />
  </svg>
);

export const CategoryIcon = ({ type }) => {
  const icons = {
    Sedans: <path d="M4,16 L4,12 L8,8 L16,7 L22,9 L26,12 L26,16 M8,18 A3,3 0 1,1 14,18 M18,18 A3,3 0 1,1 24,18" fill="none" stroke="currentColor" strokeWidth="1.5" />,
    SUVs: <path d="M3,17 L3,11 L7,7 L17,6 L23,8 L27,11 L27,17 M7,19 A3.5,3.5 0 1,1 14,19 M18,19 A3.5,3.5 0 1,1 25,19" fill="none" stroke="currentColor" strokeWidth="1.5" />,
    Hatchbacks: <path d="M4,16 L4,12 L7,9 L14,7 L20,7 L24,10 L26,14 L26,16 M8,18 A2.5,2.5 0 1,1 13,18 M19,18 A2.5,2.5 0 1,1 24,18" fill="none" stroke="currentColor" strokeWidth="1.5" />,
    Pickups: <path d="M3,16 L3,11 L6,8 L12,7 L16,7 L18,10 L27,10 L27,16 M7,18 A3,3 0 1,1 13,18 M21,18 A3,3 0 1,1 27,18" fill="none" stroke="currentColor" strokeWidth="1.5" />,
    Minivans: <path d="M3,17 L3,10 L6,7 L20,6 L25,8 L27,12 L27,17 M7,19 A3,3 0 1,1 13,19 M19,19 A3,3 0 1,1 25,19" fill="none" stroke="currentColor" strokeWidth="1.5" />,
    Luxury: <path d="M4,16 L4,11 L8,7 L17,6 L23,8 L26,11 L26,16 M8,18 A3,3 0 1,1 14,18 M18,18 A3,3 0 1,1 24,18" fill="none" stroke="currentColor" strokeWidth="1.5" />,
  };
  return <svg viewBox="0 0 30 24" fill="none" style={{ width: '100%', height: '100%' }}>{icons[type] || icons.Sedans}</svg>;
};

export const CardCarSVG = ({ type = 'sedan' }) => {
  if (type === 'suv') {
    return (
      <svg viewBox="0 0 200 100" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
        <path d="M25,68 L25,48 L40,35 L70,28 L140,28 L165,38 L180,50 L180,68" fill="none" stroke="var(--mm-ink)" strokeWidth="1.8" strokeLinejoin="round" />
        <circle cx="60" cy="72" r="11" fill="none" stroke="var(--mm-ink)" strokeWidth="1.5" />
        <circle cx="60" cy="72" r="5" fill="none" stroke="var(--mm-ink)" strokeWidth="0.8" />
        <circle cx="150" cy="72" r="11" fill="none" stroke="var(--mm-ink)" strokeWidth="1.5" />
        <circle cx="150" cy="72" r="5" fill="none" stroke="var(--mm-ink)" strokeWidth="0.8" />
        <line x1="25" y1="68" x2="180" y2="68" stroke="var(--mm-ink)" strokeWidth="1" opacity="0.3" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 200 100" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
      <path d="M20,65 L20,50 L35,42 L60,32 L90,28 L135,28 L155,35 L175,45 L180,55 L180,65" fill="none" stroke="var(--mm-ink)" strokeWidth="1.8" strokeLinejoin="round" />
      <circle cx="55" cy="70" r="10" fill="none" stroke="var(--mm-ink)" strokeWidth="1.5" />
      <circle cx="55" cy="70" r="4" fill="none" stroke="var(--mm-ink)" strokeWidth="0.8" />
      <circle cx="150" cy="70" r="10" fill="none" stroke="var(--mm-ink)" strokeWidth="1.5" />
      <circle cx="150" cy="70" r="4" fill="none" stroke="var(--mm-ink)" strokeWidth="0.8" />
      <line x1="20" y1="65" x2="180" y2="65" stroke="var(--mm-ink)" strokeWidth="1" opacity="0.3" />
    </svg>
  );
};

export const HIWIcons = [
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width: '100%', height: '100%' }}><circle cx="11" cy="11" r="7" /><path d="M16 16l5 5" /></svg>,
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width: '100%', height: '100%' }}><path d="M9 12l2 2 4-4" /><rect x="3" y="3" width="18" height="18" rx="3" /></svg>,
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width: '100%', height: '100%' }}><path d="M4 4h16v12H4z" /><path d="M8 20h8" /><path d="M12 16v4" /></svg>,
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width: '100%', height: '100%' }}><path d="M3 12l9-9 9 9" /><path d="M5 10v10h14V10" /></svg>,
];
