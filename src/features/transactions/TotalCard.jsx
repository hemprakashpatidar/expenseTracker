import { formatAmount } from '../../shared/formatters.js';
import { cx } from '../../shared/cx.js';
import skeleton from '../../shared/Skeleton.module.css';
import styles from './TotalCard.module.css';

const TotalCard = ({ isLoading, total, shownCount, totalCount }) => (
  <div className={styles.total}>
    {isLoading ? (
      <>
        <div className={cx(skeleton.block, styles.skAmount)} />
        <div className={cx(skeleton.block, styles.skLabel)} />
      </>
    ) : (
      <>
        <div className={styles.amount}>₹{formatAmount(total)}</div>
        <div className={styles.label}>{shownCount}/{totalCount} expenses</div>
      </>
    )}
  </div>
);

export default TotalCard;
