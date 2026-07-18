import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { HeartIcon, SearchIcon, CategoryIcon, CardCarSVG, HIWIcons } from '../components/Icons';
import logoImg from '../assets/logo.png';

const BRANDS_DATA = [
  { name: 'BMW', count: '2,840' }, { name: 'Mercedes', count: '2,614' },
  { name: 'Audi', count: '2,390' }, { name: 'Volkswagen', count: '3,125' },
  { name: 'Ford', count: '4,280' }, { name: 'Toyota', count: '2,915' },
  { name: 'Range Rover', count: '1,460' }, { name: 'Tesla', count: '1,824' },
];

const CATEGORIES = [
  { name: 'Sedans', count: '8,420' }, { name: 'SUVs', count: '12,640' },
  { name: 'Hatchbacks', count: '6,380' }, { name: 'Pickups', count: '2,190' },
  { name: 'Minivans', count: '1,450' }, { name: 'Luxury', count: '3,820' },
];

export default function HomePage() {
  const { listings, toggleWish, wished, showToast } = useApp();
  const { user } = useAuth();
  const navigate = useNavigate();
  const heroRef = useRef(null);
  const audioRef = useRef(null);
  const canvasRef = useRef(null);
  const [heroProgress, setHeroProgress] = useState(0);
  const [currentFrame, setCurrentFrame] = useState(1);
  const [searchTab, setSearchTab] = useState(0);

  const [imagesLoaded, setImagesLoaded] = useState(false);
  const [loadProgress, setLoadProgress] = useState(0);
  const imagesRef = useRef([]);

  const targetProgress = useRef(0);
  const currentProgress = useRef(0);
  const animationFrameId = useRef(null);

  // Preload all frames on mount
  useEffect(() => {
    const totalFrames = 80;
    let loaded = 0;
    const tempImages = [];

    const handleLoad = () => {
      loaded++;
      const progress = Math.round((loaded / totalFrames) * 100);
      setLoadProgress(progress);
      if (loaded === totalFrames) {
        setImagesLoaded(true);
      }
    };

    const handleError = () => {
      loaded++;
      const progress = Math.round((loaded / totalFrames) * 100);
      setLoadProgress(progress);
      if (loaded === totalFrames) {
        setImagesLoaded(true);
      }
    };

    for (let i = 1; i <= totalFrames; i++) {
      const img = new Image();
      img.src = `/hero-frames/frame_${String(i).padStart(3, '0')}.jpg`;
      img.onload = handleLoad;
      img.onerror = handleError;
      tempImages.push(img);
    }
    imagesRef.current = tempImages;
  }, []);

  // Canvas-based hardware accelerated drawing function
  const drawFrame = (frameIndex) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = imagesRef.current[frameIndex - 1];
    if (img && (img.complete || img.naturalWidth > 0)) {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const imgWidth = img.naturalWidth;
      const imgHeight = img.naturalHeight;
      const canvasWidth = canvas.width;
      const canvasHeight = canvas.height;

      const imgRatio = imgWidth / imgHeight;
      const canvasRatio = canvasWidth / canvasHeight;

      let drawWidth, drawHeight, drawX, drawY;
      const isMobile = window.innerWidth <= 768;

      if (isMobile) {
        // Mobile contain-fit strategy so that the entire car frames are visible on portrait screens
        if (imgRatio > canvasRatio) {
          drawWidth = canvasWidth;
          drawHeight = canvasWidth / imgRatio;
          drawX = 0;
          drawY = (canvasHeight - drawHeight) / 2;
        } else {
          drawWidth = canvasHeight * imgRatio;
          drawHeight = canvasHeight;
          drawX = (canvasWidth - drawWidth) / 2;
          drawY = 0;
        }
      } else {
        // Desktop cover-fit strategy to keep the video immersive
        if (imgRatio > canvasRatio) {
          drawWidth = canvasHeight * imgRatio;
          drawHeight = canvasHeight;
          drawX = (canvasWidth - drawWidth) / 2;
          drawY = 0;
        } else {
          drawWidth = canvasWidth;
          drawHeight = canvasWidth / imgRatio;
          drawX = 0;
          drawY = (canvasHeight - drawHeight) / 2;
        }
      }

      ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);
    }
  };

  useEffect(() => {
    if (imagesLoaded) {
      drawFrame(currentFrame);
    }
  }, [currentFrame, imagesLoaded]);

  useEffect(() => {
    const handleResize = () => {
      if (imagesLoaded) {
        drawFrame(currentFrame);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [currentFrame, imagesLoaded]);

  /* Scroll-driven frame animation + LERP + Audio Sync */
  useEffect(() => {
    const totalFrames = 80;

    const updateFrameProgress = () => {
      const audio = audioRef.current;
      const dest = targetProgress.current;
      const diff = dest - currentProgress.current;
      
      if (Math.abs(diff) > 0.001) {
        currentProgress.current += diff * 0.08;
        const progressPercent = currentProgress.current * 100;
        setHeroProgress(progressPercent);
        
        // Map 0-1 progress to 1-80 frames
        const frameIndex = Math.min(Math.max(Math.round(currentProgress.current * (totalFrames - 1)) + 1, 1), totalFrames);
        setCurrentFrame(frameIndex);
        
        // Sync audio
        if (audio && audio.duration) {
          audio.muted = false;
          if (audio.paused) {
            audio.play().catch(() => {});
          }
          const targetTime = currentProgress.current * audio.duration;
          // Only force seek if drift exceeds 350ms to keep sound smooth
          if (Math.abs(audio.currentTime - targetTime) > 0.35) {
            audio.currentTime = targetTime;
          }
        }
        
        animationFrameId.current = requestAnimationFrame(updateFrameProgress);
      } else {
        currentProgress.current = dest;
        const progressPercent = dest * 100;
        setHeroProgress(progressPercent);
        
        const frameIndex = Math.min(Math.max(Math.round(dest * (totalFrames - 1)) + 1, 1), totalFrames);
        setCurrentFrame(frameIndex);
        
        // Play audio if in video section, pause if scrolled past it
        if (audio) {
          if (dest >= 0.99) {
            if (!audio.paused) {
              audio.pause();
            }
          } else {
            audio.muted = false;
            if (audio.paused) {
              audio.play().catch(() => {});
            }
            if (audio.duration) {
              audio.currentTime = dest * audio.duration;
            }
          }
        }
        animationFrameId.current = null;
      }
    };

    const onScroll = () => {
      const scrollY = window.scrollY;
      const heroH = heroRef.current?.offsetHeight || window.innerHeight;
      const winH = window.innerHeight;
      const progress = Math.min(Math.max(scrollY / (heroH - winH), 0), 1);
      
      targetProgress.current = progress;
      
      if (!animationFrameId.current) {
        animationFrameId.current = requestAnimationFrame(updateFrameProgress);
      }
    };

    const unmuteAudio = () => {
      const audio = audioRef.current;
      if (audio) {
        audio.muted = false;
        if (targetProgress.current < 0.99 && audio.paused) {
          audio.play().catch(() => {});
        }
      }
    };

    window.addEventListener('click', unmuteAudio, { once: true });
    window.addEventListener('scroll', unmuteAudio, { once: true, passive: true });
    window.addEventListener('scroll', onScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('click', unmuteAudio);
      window.removeEventListener('scroll', unmuteAudio);
      if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
    };
  }, []);

  /* Intersection observer for reveals */
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); }),
      { threshold: 0.12 }
    );
    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const handleWishlistClick = (carId, e) => {
    e.stopPropagation();
    toggleWish(carId);
  };

  const renderCard = (car) => (
    <div className="car-card" key={car.id} onClick={() => navigate(`/car/${car.id}`)}>
      <div className="car-card-image">
        <CardCarSVG type={car.bodyType === 'SUV' ? 'suv' : 'sedan'} />
        <div className="car-card-badges">
          {car.badges?.includes('featured') && <span className="badge badge-featured">Featured</span>}
          {car.badges?.includes('verified') && <span className="badge badge-verified">Verified</span>}
          {car.badges?.includes('new') && <span className="badge badge-new">New</span>}
        </div>
        <button className={`wishlist-btn${wished[car.id] ? ' wished' : ''}`} onClick={(e) => handleWishlistClick(car.id, e)}>
          <HeartIcon filled={wished[car.id]} />
        </button>
      </div>
      <div className="car-card-body">
        <div className="car-card-make">{car.make}</div>
        <div className="car-card-model">{car.model}</div>
        <div className="car-card-specs">
          <span className="spec-chip">{car.year}</span>
          <span className="spec-chip">{(car.mileage / 1000).toFixed(0)}k mi</span>
          <span className="spec-chip">{car.fuel}</span>
        </div>
        <div className="car-card-footer">
          <span className="car-card-price">£{car.price.toLocaleString()}</span>
          <span className="car-card-city">📍 {car.city}</span>
        </div>
      </div>
    </div>
  );

  const activeCars = listings.filter(c => c.status === 'active');

  return (
    <>
      {/* ── VIDEO HERO ─────────────────────────────────── */}
      <section className="hero video-hero" ref={heroRef}>
        <div className="video-hero-sticky">
          {!imagesLoaded && (
            <div className="hero-loader-overlay">
              <div className="hero-loader-content">
                <div className="hero-loader-spinner"></div>
                <div className="hero-loader-text">Loading Experience {loadProgress}%</div>
                <div className="hero-loader-bar-container">
                  <div className="hero-loader-bar" style={{ width: `${loadProgress}%` }}></div>
                </div>
              </div>
            </div>
          )}
          <canvas ref={canvasRef} className="hero-video" style={{ display: imagesLoaded ? 'block' : 'none' }} />
          <audio ref={audioRef} src="/hero-audio.mp3" preload="auto" loop />
          <div className="hero-video-overlay" />

          <div 
            className="hero-content" 
            style={{ 
              '--hero-progress-percent': `${heroProgress * 2.5}%`,
              opacity: Math.max(0, 1 - heroProgress / 45),
              transform: `translateY(${-heroProgress * 0.6}px)`
            }}
          >
            <div className="hero-eyebrow">UK's Premier Auto Marketplace</div>
            <h1 className="hero-title">
              <span className="word word-find">Find</span>
              <span className="word word-your">Your</span>
              <span className="word word-drive amber">Drive.</span>
            </h1>
            <p className="hero-desc">
              The UK's most trusted automotive marketplace. Browse thousands of verified vehicles from dealers and private sellers across Britain.
            </p>
            <div className="hero-ctas">
              <Link to="/listings" className="btn-hero-primary">Browse Cars</Link>
              <Link to="/register" className="btn-hero-ghost">Sell Your Car</Link>
            </div>
          </div>

          <div className={`hero-stats-overlay${heroProgress > 30 && heroProgress < 80 ? ' visible' : ''}`}>
            <div><div className="hero-stat-num">48K+</div><div className="hero-stat-label">Active Listings</div></div>
            <div><div className="hero-stat-num">12K+</div><div className="hero-stat-label">Verified Sellers</div></div>
            <div><div className="hero-stat-num">4.2d</div><div className="hero-stat-label">Avg. Sell Time</div></div>
          </div>

          <div className="scroll-hint">
            <span className="scroll-hint-label">SCROLL</span>
            <div className="scroll-hint-line" />
          </div>
          <div className="hero-progress" style={{ width: `${heroProgress}%` }} />
        </div>
      </section>

      {/* ── SEARCH ──────────────────────────────────────── */}
      <section className="search-section reveal">
        <div className="container">
          <div className="search-tabs">
            {['Used Cars', 'New Cars', 'Bikes', 'Commercial'].map((tab, i) => (
              <button key={tab} className={`search-tab${searchTab === i ? ' active' : ''}`} onClick={() => setSearchTab(i)}>{tab}</button>
            ))}
          </div>
          <div className="search-grid">
            <select className="search-select"><option>Make</option><option>BMW</option><option>Mercedes</option><option>Audi</option><option>Volkswagen</option><option>Ford</option><option>Toyota</option></select>
            <select className="search-select"><option>Model</option></select>
            <select className="search-select"><option>Price Range</option><option>Under £10,000</option><option>£10,000 - £25,000</option><option>£25,000 - £50,000</option><option>£50,000+</option></select>
            <select className="search-select"><option>Location</option><option>London</option><option>Manchester</option><option>Birmingham</option><option>Leeds</option><option>Edinburgh</option></select>
            <select className="search-select"><option>Year</option><option>2024</option><option>2023</option><option>2022</option><option>2021</option></select>
            <Link to="/listings" className="btn-search"><SearchIcon /> Search</Link>
          </div>
          <div className="search-pills">
            {['BMW 3 Series', 'Mercedes C-Class', 'Audi Q5', 'Tesla Model 3', 'Under £30k', 'Electric Cars', 'SUVs London'].map(pill => (
              <Link key={pill} to="/listings" className="search-pill">{pill}</Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURED LISTINGS ────────────────────────────── */}
      <section className="featured-section">
        <div className="container reveal">
          <div className="section-header">
            <div>
              <div className="section-label">Featured</div>
              <h2 className="section-heading"><span>Handpicked</span><span>For You</span></h2>
            </div>
            <Link to="/listings" className="view-all">View All →</Link>
          </div>
          <div className="car-grid">
            {activeCars.slice(0, 4).map(renderCard)}
          </div>
        </div>
      </section>

      {/* ── CATEGORIES ───────────────────────────────────── */}
      <section className="categories-section">
        <div className="container reveal">
          <div style={{ textAlign: 'center', marginBottom: 36 }}>
            <div className="section-label">Categories</div>
            <h2 className="section-heading" style={{ display: 'inline-block' }}>Browse by Type</h2>
          </div>
          <div className="categories-grid">
            {CATEGORIES.map(cat => (
              <Link key={cat.name} to="/listings" className="category-card">
                <div className="category-icon"><CategoryIcon type={cat.name} /></div>
                <div className="category-name">{cat.name}</div>
                <div className="category-count">{cat.count} listings</div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── STATS STRIP ──────────────────────────────────── */}
      <section className="stats-strip reveal">
        <div className="container">
          <div className="stats-grid">
            <div className="stat-item"><div className="stat-number">48<span className="accent">,260</span></div><div className="stat-desc">Active Listings Nationwide</div></div>
            <div className="stat-item"><div className="stat-number">12<span className="accent-amber">,840</span></div><div className="stat-desc">Verified Sellers & Dealers</div></div>
            <div className="stat-item"><div className="stat-number">4.2<span className="accent-green">d</span></div><div className="stat-desc">Average Time to Sell</div></div>
            <div className="stat-item"><div className="stat-number">98<span className="accent">%</span></div><div className="stat-desc">Customer Satisfaction</div></div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────── */}
      <section className="hiw-section">
        <div className="container reveal">
          <div style={{ textAlign: 'center', marginBottom: 36 }}>
            <div className="section-label">How It Works</div>
            <h2 className="section-heading" style={{ display: 'inline-block' }}>Four Simple Steps</h2>
          </div>
          <div className="hiw-grid">
            {['Search & Filter', 'Inspect & Compare', 'Contact Seller', 'Drive Home'].map((step, i) => (
              <div key={step} className="hiw-step">
                <div className="hiw-step-num">0{i + 1}</div>
                <div className="hiw-icon">{HIWIcons[i]}</div>
                <div className="hiw-title">{step}</div>
                <div className="hiw-text">
                  {i === 0 && 'Browse thousands of verified cars across the UK. Filter by make, model, price, and location.'}
                  {i === 1 && 'View detailed inspection reports, compare specs side by side, and make an informed choice.'}
                  {i === 2 && 'Reach out directly to verified sellers. Schedule viewings and negotiate with confidence.'}
                  {i === 3 && "Complete the purchase, handle paperwork, and drive your new car home. It's that simple."}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SELL BANNER ──────────────────────────────────── */}
      <section className="sell-banner">
        <div className="container reveal">
          <div className="sell-banner-inner">
            <div className="sell-banner-content">
              <div className="section-label">Sell Your Car</div>
              <h2 className="section-heading" style={{ marginBottom: 16 }}><span>Reach Thousands</span><span>of Buyers</span></h2>
              <p style={{ fontSize: '0.92rem', lineHeight: 1.7, color: 'var(--mm-steel)', marginBottom: 8 }}>
                List your vehicle in minutes and connect with verified buyers across the UK.
              </p>
              <div className="sell-banner-ctas">
                <Link to="/register" className="btn-solid">List Your Car — Free</Link>
                <button className="btn-outline" onClick={() => showToast('Learn more coming soon')}>Learn More</button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── BRANDS ROW ───────────────────────────────────── */}
      <section className="brands-section">
        <div className="container reveal">
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <div className="section-label">Popular Brands</div>
          </div>
          <div className="brands-row">
            {BRANDS_DATA.map(brand => (
              <Link key={brand.name} to="/listings" className="brand-cell">
                <div className="brand-name">{brand.name}</div>
                <div className="brand-count">{brand.count} cars</div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── BLOG/NEWS ────────────────────────────────────── */}
      <section className="blog-section">
        <div className="container reveal">
          <div className="section-header">
            <div>
              <div className="section-label">Editorial</div>
              <h2 className="section-heading"><span>Latest</span><span>Motoring News</span></h2>
            </div>
            <a href="#" className="view-all">View All →</a>
          </div>
          <div className="blog-grid">
            {[
              { cat: 'Electric', title: "Best Electric SUVs to Buy in the UK 2026", excerpt: 'From the BMW iX to the Tesla Model Y — our editors pick the best electric SUVs available in Britain right now.', author: 'Emily R.', date: '14 Jul 2026' },
              { cat: 'Market', title: 'Used Car Prices Stabilise After Two-Year Surge', excerpt: 'Following unprecedented demand, the UK used car market shows signs of returning to pre-pandemic pricing levels.', author: 'David K.', date: '12 Jul 2026' },
              { cat: 'Guide', title: "A First-Time Buyer's Complete UK Car Guide", excerpt: 'Everything you need to know about purchasing your first car in the UK — from insurance to MOTs, tax, and more.', author: 'Sarah M.', date: '10 Jul 2026' },
            ].map((post, i) => (
              <div key={i} className="blog-card">
                <div className="blog-card-image">
                  <span className="blog-category-tag">{post.cat}</span>
                </div>
                <div className="blog-card-body">
                  <div className="blog-title">{post.title}</div>
                  <div className="blog-excerpt">{post.excerpt}</div>
                  <div className="blog-meta">
                    <span>{post.author}</span>
                    <span>{post.date}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
