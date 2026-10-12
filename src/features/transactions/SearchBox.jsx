const SearchBox = ({ value, onChange }) => (
  <div className="et-search">
    <span className="et-search-icon">🔍</span>
    <input
      type="text"
      placeholder="Search..."
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  </div>
);

export default SearchBox;
