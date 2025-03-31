import React, { useState, useEffect } from "react";
import { Filter, Branch, Year } from "@/types";
import { getBranches, getYears } from "@/services/api";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";

interface NoteFiltersProps {
  filter: Filter;
  setFilter: React.Dispatch<React.SetStateAction<Filter>>;
}

const NoteFilters: React.FC<NoteFiltersProps> = ({ filter, setFilter }) => {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [years, setYears] = useState<Year[]>([]);
  const [searchTerm, setSearchTerm] = useState(filter.search || "");
  const [subjectTerm, setSubjectTerm] = useState(filter.subject || "");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchFilterData = async () => {
      try {
        const [branchesData, yearsData] = await Promise.all([
          getBranches(),
          getYears(),
        ]);
        
        setBranches(branchesData);
        setYears(yearsData);
      } catch (error) {
        console.error("Error fetching filter data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFilterData();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setFilter(prev => ({ 
      ...prev, 
      search: searchTerm,
      subject: subjectTerm 
    }));
  };

  const handleReset = () => {
    setSearchTerm("");
    setSubjectTerm("");
    setFilter({});
  };

  const handleBranchChange = (value: string) => {
    setFilter(prev => ({ ...prev, branch: value || undefined }));
  };

  const handleYearChange = (value: string) => {
    setFilter(prev => ({ ...prev, year: value || undefined }));
  };

  return (
    <div className="bg-muted/30 p-4 rounded-lg">
      <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4 items-end">
        <div className="flex-1 relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search by title or content..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>

        <div className="flex-1 relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search by subject..."
            value={subjectTerm}
            onChange={(e) => setSubjectTerm(e.target.value)}
            className="pl-8"
          />
        </div>
        
        <div className="flex-1">
          <Label htmlFor="branch">Branch</Label>
          <Select
            value={filter.branch || "all"}
            onValueChange={handleBranchChange}
            disabled={isLoading}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select branch" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Branches</SelectItem>
              {branches.map((branch) => (
                <SelectItem key={branch.id} value={branch.id}>
                  {branch.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex-1">
          <Label htmlFor="year">Year</Label>
          <Select
            value={filter.year || "all"}
            onValueChange={handleYearChange}
            disabled={isLoading}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select year" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Years</SelectItem>
              {years.map((year) => (
                <SelectItem key={year.id} value={year.id}>
                  {year.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-2">
          <Button type="button" variant="outline" size="sm" onClick={handleReset}>
            <X className="mr-2 h-4 w-4" />
            Reset
          </Button>
          <Button type="submit" size="sm">
            <Search className="mr-2 h-4 w-4" />
            Search
          </Button>
        </div>
      </form>
    </div>
  );
};

export default NoteFilters;
