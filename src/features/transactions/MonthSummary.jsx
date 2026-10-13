import { formatAmount } from '../../shared/formatters.js';
import { cx } from '../../shared/cx.js';
import skeleton from '../../shared/Skeleton.module.css';
import styles from './MonthSummary.module.css';

// "12% less than this point in September", or nothing when there is no fair comparison
const Comparison = ({ total, previousTotal, previousMonthName, partialMonth }) => {
  if (previousTotal === null || previousTotal === undefined || previousTotal === 0) return null;
  const than = partialMonth ? `this point in ${previousMonthName}` : previousMonthName;
  const percent = Math.round((Math.abs(total - previousTotal) / previousTotal) * 100);

  if (percent === 0) return <div className={styles.comparison}>About the same as {than}</div>;
  const less = total < previousTotal;
  return (
    <div className={cx(styles.comparison, less ? styles.less : styles.more)}>
      <span aria-hidden="true">{less ? '↓' : '↑'}</span> {percent}% {less ? 'less' : 'more'} than {than}
    </div>
  );
};

// The month's indigo card: month switcher, total, expense count and comparison with last month
const MonthSummary = ({
  isLoading, monthNav, monthName, total, count,
  previousTotal, previousMonthName, partialMonth,
  filtersActive, shownTotal, shownCount,
}) => (
  <section className={styles.card} aria-label={`Spending in ${monthName}`}>
    <div className={styles.top}>
      <span className={styles.label}>Spent in</span>
      {monthNav}
    </div>

    {isLoading ? (
      <>
        <div className={cx(skeleton.block, styles.skAmount)} />
        <div className={cx(skeleton.block, styles.skLine)} />
      </>
    ) : (
      <>
        <div className={styles.amount}>₹{formatAmount(total)}</div>
        <div className={styles.meta}>{count} {count === 1 ? 'expense' : 'expenses'}</div>
        <Comparison total={total} previousTotal={previousTotal} previousMonthName={previousMonthName} partialMonth={partialMonth} />
        {filtersActive && (
          <div className={styles.filtered}>Showing ₹{formatAmount(shownTotal)} across {shownCount} with filters</div>
        )}
      </>
    )}
  </section>
);

export default MonthSummary;
