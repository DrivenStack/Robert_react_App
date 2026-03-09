import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './ProductSummary.css';

// ── Add-on metadata (must match App.jsx) ─────────────────────
const addOns = [
  { name: 'Motorization',           price: 250 },
  { name: 'Remote Control',         price: 75  },
  { name: 'Smart Home Integration', price: 150 },
  { name: 'Decorative Valance',     price: 100 },
  { name: 'Cordless Lift',          price: 50  },
  { name: 'Premium Fabric Upgrade', price: 125 },
];

const fmt = (n) => `$${Number(n || 0).toFixed(2)}`;

// ── Individual product card ───────────────────────────────────
function ProductCard({ line, index, snapshot }) {
  const enriched    = snapshot.productLines.find(l => l.id === line.id);
  const lineTotal   = enriched?.pricing?.lineSubtotal || 0;
  const priceNote   = enriched?.pricing?.priceNote    || '';

  const selectedAddons = line.addons
    .map((checked, i) => (checked ? addOns[i] : null))
    .filter(Boolean);

  const details = [
    { label: 'Category',        value: line.category              },
    { label: 'Width',           value: line.width      || '—'     },
    { label: 'Height / Proj.',  value: line.height     || '—'     },
    { label: 'Quantity',        value: line.quantity              },
    line.mount  && { label: 'Mount Type', value: line.mount  },
    line.fabric && { label: 'Fabric',     value: line.fabric },
    line.color  && { label: 'Color',      value: line.color  },
    { label: 'Operation', value: line.operation, capitalize: true },
  ].filter(Boolean);

  return (
    <div className="ps-product-card">
      <div className="ps-product-header">
        <div className="ps-product-number">#{index + 1}</div>
        <div className="ps-product-name">{line.product}</div>
        <div className="ps-product-price">{fmt(lineTotal)}</div>
      </div>

      <div className="ps-detail-grid">
        {details.map(({ label, value, capitalize }) => (
          <div className="ps-detail-item" key={label}>
            <span className="ps-detail-label">{label}</span>
            <span
              className="ps-detail-value"
              style={capitalize ? { textTransform: 'capitalize' } : {}}
            >
              {value}
            </span>
          </div>
        ))}
      </div>

      {selectedAddons.length > 0 && (
        <div className="ps-addons-row">
          <span className="ps-addons-heading">Add-ons</span>
          <div className="ps-addons-list">
            {selectedAddons.map((addon) => (
              <span key={addon.name} className="ps-addon-tag">
                {addon.name} <em>+{fmt(addon.price)}</em>
              </span>
            ))}
          </div>
        </div>
      )}

      {priceNote && (
        <div className="ps-price-note">💡 {priceNote}</div>
      )}

      {line.notes && (
        <div className="ps-product-notes">
          <span className="ps-detail-label">Notes — </span>
          {line.notes}
        </div>
      )}
    </div>
  );
}

// ── Main ProductSummary page ──────────────────────────────────
export default function ProductSummary() {
  const location = useLocation();
  const navigate = useNavigate();

  // Data was passed via navigate('/summary', { state: { snapshot } })
  const snapshot = location.state?.snapshot;

  // Guard: if someone visits /summary directly with no data
  if (!snapshot) {
    return (
      <div className="ps-page">
        <header className="ps-header">
          <div className="ps-header-glow" />
          <div className="ps-header-content">
            <h1>Order Summary</h1>
            <p>No order data found.</p>
          </div>
        </header>
        <div className="ps-body">
          <button className="ps-btn ps-btn-back" onClick={() => navigate('/')}>
            ← Back to Form
          </button>
        </div>
      </div>
    );
  }

  const { customer, productLines, discount, orderNotes, pricingSummary, lastUpdated } = snapshot;
  const configuredLines = productLines.filter(l => l.category && l.product);

  return (
    <div className="ps-page">

      {/* ══ Header ══════════════════════════════════════════════ */}
      <header className="ps-header">
        <div className="ps-header-glow" />
        <div className="ps-header-content">
          <h1>Order Summary</h1>
          <p>Review your complete order before finalising</p>
        </div>
      </header>

      <div className="ps-body">

        {/* ── Top nav ── */}
        <div className="ps-nav-row">
          <button className="ps-btn ps-btn-back" onClick={() => navigate('/')}>
            ← Back to Form
          </button>
          <span className="ps-last-updated">
            Last updated: {new Date(lastUpdated).toLocaleString()}
          </span>
        </div>

        {/* ══ Customer Card ════════════════════════════════════ */}
        <section className="ps-card">
          <div className="ps-card-heading">
            <span className="ps-card-icon">👤</span>
            <h2>Customer Information</h2>
          </div>
          <div className="ps-customer-grid">
            {[
              { label: 'Full Name',            value: customer.name    },
              { label: 'Email Address',        value: customer.email   },
              { label: 'Phone',                value: customer.phone   },
              { label: 'Installation Address', value: customer.address },
            ].map(({ label, value }) => (
              <div className="ps-customer-item" key={label}>
                <span className="ps-detail-label">{label}</span>
                <span className="ps-detail-value">{value || '—'}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ══ Products Card ════════════════════════════════════ */}
        <section className="ps-card">
          <div className="ps-card-heading">
            <span className="ps-card-icon">📦</span>
            <h2>
              Products
              <span className="ps-badge">{configuredLines.length}</span>
            </h2>
          </div>

          {configuredLines.length === 0 ? (
            <p className="ps-empty">No products have been configured yet.</p>
          ) : (
            <div className="ps-products-list">
              {configuredLines.map((line, idx) => (
                <ProductCard
                  key={line.id}
                  line={line}
                  index={idx}
                  snapshot={snapshot}
                />
              ))}
            </div>
          )}
        </section>

        {/* ══ Pricing Card ═════════════════════════════════════ */}
        <section className="ps-card">
          <div className="ps-card-heading">
            <span className="ps-card-icon">💰</span>
            <h2>Pricing Summary</h2>
          </div>
          <div className="ps-pricing-table">
            <div className="ps-pricing-row">
              <span>Subtotal</span>
              <span>{fmt(pricingSummary?.subtotal)}</span>
            </div>
            <div className="ps-pricing-row">
              <span>Discount ({pricingSummary?.discountPercent || 0}%)</span>
              <span className="ps-discount-value">
                −{fmt(pricingSummary?.discountAmount)}
              </span>
            </div>
            {discount.percent > 20 && (
              <div className="ps-pricing-row ps-manager-row">
                <span>Manager Approval</span>
                <span>{discount.managerName || '—'}</span>
              </div>
            )}
            <div className="ps-pricing-row ps-total-row">
              <span>Total</span>
              <span>{fmt(pricingSummary?.total)}</span>
            </div>
          </div>
        </section>

        {/* ══ Notes Card ══════════════════════════════════════ */}
        {orderNotes && (
          <section className="ps-card">
            <div className="ps-card-heading">
              <span className="ps-card-icon">📝</span>
              <h2>Order Notes</h2>
            </div>
            <p className="ps-notes-text">{orderNotes}</p>
          </section>
        )}

        {/* ══ Action Buttons ═══════════════════════════════════ */}
        <div className="ps-actions">
          <button className="ps-btn ps-btn-back" onClick={() => navigate('/')}>
            ← Back to Form
          </button>
          <button
            className="ps-btn ps-btn-primary"
            onClick={() => alert('📄 Generating proposal...')}
          >
            📄 Generate Proposal
          </button>
          <button
            className="ps-btn ps-btn-secondary"
            onClick={() => alert('💳 Processing payment...')}
          >
            💳 Collect Payment
          </button>
          <button
            className="ps-btn ps-btn-outline"
            onClick={() => {
              console.log('📤 GHL Export:', snapshot);
              alert('📤 Exported to GHL!');
            }}
          >
            📤 Export to GHL
          </button>
        </div>

      </div>
    </div>
  );
}