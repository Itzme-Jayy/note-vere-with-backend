import React from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface NoteFiltersProps {
  filters: {
    branch: string;
    year: string;
    subject: string;
    search: string;
  };
  onFilterChange: (filters: {
    branch: string;
    year: string;
    subject: string;
    search: string;
  }) => void;
}

const NoteFilters: React.FC<NoteFiltersProps> = ({ filters, onFilterChange }) => {
  const handleChange = (key: keyof typeof filters, value: string) => {
    onFilterChange({ ...filters, [key]: value });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
      <Input
        placeholder="Search notes..."
        value={filters.search}
        onChange={(e) => handleChange('search', e.target.value)}
        className="md:col-span-2"
      />
      <Select value={filters.branch} onValueChange={(value) => handleChange('branch', value)}>
        <SelectTrigger>
          <SelectValue placeholder="Select Branch" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="">All Branches</SelectItem>
          <SelectItem value="CSE">CSE</SelectItem>
          <SelectItem value="ECE">ECE</SelectItem>
          <SelectItem value="ME">ME</SelectItem>
          <SelectItem value="CE">CE</SelectItem>
          <SelectItem value="IT">IT</SelectItem>
        </SelectContent>
      </Select>
      <Select value={filters.year} onValueChange={(value) => handleChange('year', value)}>
        <SelectTrigger>
          <SelectValue placeholder="Select Year" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="">All Years</SelectItem>
          <SelectItem value="1st">1st Year</SelectItem>
          <SelectItem value="2nd">2nd Year</SelectItem>
          <SelectItem value="3rd">3rd Year</SelectItem>
          <SelectItem value="4th">4th Year</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};

export default NoteFilters;
