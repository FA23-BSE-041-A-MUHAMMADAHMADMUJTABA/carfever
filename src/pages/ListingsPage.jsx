import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { HeartIcon, GridIcon, ListIcon, CardCarSVG } from '../components/Icons';

export default function ListingsPage() {
  const { listings, toggleWish, wished } = useApp();
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState('grid');
  const [filters, setFilters] = useState({ make: '', fuel: '', bodyType: '', maxPrice: '', minPrice: '' });
  const [sort, setSort] = useState('latest');

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); }),
      { threshold: 0.12 }
    );
    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const activeCars = listings.filter(c => c.status === 'active');
  let filtered = [...activeCars];
  if (filters.make) filtered = filtered.filter(c => c.make === filters.make);
  if (filters.fuel) filtered = filtered.filter(c => c.fuel === filters.fuel);
  if (filters.bodyType) filtered = filtered.filter(c => c.bodyType.toLowerCase() === filters.bodyType.toLowerCase());
  if (filters.minPrice) filtered = filtered.filter(c => c.price >= Number(filters.minPrice));
  if (filters.maxPrice) filtered = filtered.filter(c => c.price <= Number(filters.maxPrice));

  if (sort === 'price-low') filtered.sort((a, b) => a.price - b.price);
  else if (sort === 'price-high') filtered.sort((a, b) => b.price - a.price);
  else if (sort === 'year') filtered.sort((a, b) => b.year - a.year);
  else if (sort === 'mileage') filtered.sort((a, b) => a.mileage - b.mileage);

  const handleWishlistClick = (carId, e) => {
    e.stopPropagation();
    toggleWish(carId);
  };

  const renderCard = (car) => (
    <div className={`car-card ${viewMode === 'list' ? 'list-layout-card' : ''}`} key={car.id} onClick={() => navigate(`/car/${car.id}`)}>
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

  const clearFilters = () => setFilters({ make: '', fuel: '', bodyType: '', maxPrice: '', minPrice: '' });

  return (
    <div className="listings-page">
      <div className="listings-header">
        <div className="container">
          <h1 style={{ fontFamily: 'var(--ff-display)', fontWeight: 800, fontSize: '2rem', color: 'var(--mm-ink)' }}>Browse Cars</h1>
        </div>
      </div>
      <div className="container">
        <div className="listings-layout">
          <aside className="filter-sidebar">
            <div className="filter-sidebar-header">
              <span className="filter-sidebar-title">Filters</span>
              <span className="filter-clear" onClick={clearFilters}>Clear All</span>
            </div>
            <div className="filter-group">
              <div className="filter-group-title">Make</div>
              <select className="search-select" value={filters.make} onChange={e => setFilters(p => ({ ...p, make: e.target.value }))}>
                <option value="">All Makes</option>
                {[...new Set(activeCars.map(c => c.make))].sort().map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div className="filter-group">
              <div className="filter-group-title">Price Range</div>
              <div className="filter-price-inputs">
                <input type="number" className="filter-price-input" placeholder="Min £" value={filters.minPrice} onChange={e => setFilters(p => ({ ...p, minPrice: e.target.value }))} />
                <input type="number" className="filter-price-input" placeholder="Max £" value={filters.maxPrice} onChange={e => setFilters(p => ({ ...p, maxPrice: e.target.value }))} />
              </div>
            </div>
            <div className="filter-group">
              <div className="filter-group-title">Fuel Type</div>
              <select className="search-select" value={filters.fuel} onChange={e => setFilters(p => ({ ...p, fuel: e.target.value }))}>
                <option value="">All Fuels</option>
                {['Petrol', 'Diesel', 'Electric', 'Hybrid'].map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
            <div className="filter-group">
              <div className="filter-group-title">Body Type</div>
              <select className="search-select" value={filters.bodyType} onChange={e => setFilters(p => ({ ...p, bodyType: e.target.value }))}>
                <option value="">All Types</option>
                {['Sedan', 'SUV', 'Hatchback'].map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
          </aside>
          <div>
            <div className="listings-toolbar">
              <span className="listings-count">{filtered.length} listings found</span>
              <div className="toolbar-right">
                <select className="sort-select" value={sort} onChange={e => setSort(e.target.value)}>
                  <option value="latest">Latest First</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="year">Year: Newest</option>
                  <option value="mileage">Mileage: Lowest</option>
                </select>
                <div className="view-toggle">
                  <button className={`view-btn${viewMode === 'grid' ? ' active' : ''}`} onClick={() => setViewMode('grid')}><GridIcon /></button>
                  <button className={`view-btn${viewMode === 'list' ? ' active' : ''}`} onClick={() => setViewMode('list')}><ListIcon /></button>
                </div>
              </div>
            </div>
            <div className="listings-grid">
              {filtered.length > 0 ? filtered.map(renderCard) : (
                <div className="empty-state">
                  <h3>No cars match your filters</h3>
                  <p>Try adjusting your search criteria</p>
                  <button className="btn-solid" onClick={clearFilters}>Clear Filters</button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
