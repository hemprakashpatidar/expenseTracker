import { formatAmount } from '../../shared/formatters.js';

const TotalCard = ({ isLoading, total, shownCount, totalCount }) => (
  <div className="et-total">
    {isLoading ? (
      <>
        <div className="et-sk" style={{ height: '15px', width: '80px', borderRadius: '6px', marginBottom: '4px' }} />
        <div className="et-sk" style={{ height: '10px', width: '55px', borderRadius: '4px', opacity: 0.6 }} />
      </>
    ) : (
      <>
        <div className="et-total-amount">₹{formatAmount(total)}</div>
        <div className="et-total-label">{shownCount}/{totalCount} expenses</div>
      </>
    )}
  </div>
);

export default TotalCard;
