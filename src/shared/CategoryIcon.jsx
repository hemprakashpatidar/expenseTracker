import Icon from './Icon.jsx';
import { getCategoryColor, getCategoryIconName } from './categoryStyle.js';
import { cx } from './cx.js';
import styles from './CategoryIcon.module.css';

// A category's icon in its own colour; `tile` sets it on a soft tinted square (list rows)
const CategoryIcon = ({ category, size = 16, tile = false, className }) => (
  <span
    className={cx(tile ? styles.tile : styles.plain, className)}
    style={{ '--category': getCategoryColor(category) }}
  >
    <Icon name={getCategoryIconName(category)} size={size} />
  </span>
);

export default CategoryIcon;
