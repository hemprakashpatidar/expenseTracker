// Join class names, skipping falsy entries: cx(styles.btn, active && styles.active)
export const cx = (...classes) => classes.filter(Boolean).join(' ');
