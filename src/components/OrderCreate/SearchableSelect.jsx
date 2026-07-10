import Select from "react-select";

const SearchableSelect = ({ id, value, onChange, options, placeholder }) => {
  return (
    <Select
      id={id}
      value={options?.find((opt) => opt.value === value) || null}
      onChange={(selected) => onChange({ target: { id, value: selected ? selected.value : "" } })}
      options={options || []}
      placeholder={placeholder}
      isSearchable
      isClearable
      classNames={{
        control: (state) =>
          `!bg-[#ebeae5] dark:!bg-[#1f1f1f] !border-transparent focus-within:!border-[#26251e]/20 dark:focus-within:!border-[#f7f7f4]/20 !shadow-none !rounded-lg !min-h-[44px] transition-all cursor-pointer`,
        menu: () => `!bg-[#f7f7f4] dark:!bg-[#1c1c1c] !border !border-[#26251e]/10 dark:!border-[#f7f7f4]/10 !shadow-lg !rounded-lg mt-1 overflow-hidden`,
        menuList: () => `!p-1`,
        option: (state) =>
          `!cursor-pointer !rounded-md !px-3 !py-2 hover:!bg-[#ebeae5] dark:hover:!bg-[#2c2c2c] transition-colors ${
            state.isSelected
              ? "!bg-[#26251e] !text-[#f7f7f4] dark:!bg-[#f7f7f4] dark:!text-[#26251e]"
              : "!text-[#26251e] dark:!text-[#f7f7f4]"
          }`,
        singleValue: () => `!text-[#26251e] dark:!text-[#f7f7f4]`,
        input: () => `!text-[#26251e] dark:!text-[#f7f7f4]`,
        placeholder: () => `!text-[#26251e]/50 dark:!text-[#f7f7f4]/50`,
        indicatorSeparator: () => `!bg-[#26251e]/10 dark:!bg-[#f7f7f4]/10 !my-2`,
        dropdownIndicator: () => `!text-[#26251e]/50 dark:!text-[#f7f7f4]/50 hover:!text-[#26251e] dark:hover:!text-[#f7f7f4] !p-2 cursor-pointer`,
        clearIndicator: () => `!text-[#26251e]/50 dark:!text-[#f7f7f4]/50 hover:!text-[#cf2d56] !p-2 cursor-pointer`,
      }}
    />
  );
};

export default SearchableSelect;
