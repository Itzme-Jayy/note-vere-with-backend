
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
    setFilter(prev => ({ ...prev, search: searchTerm }));
  };

  const handleReset = () => {
    setSearchTerm("");
    setFilter({});
  };

  const handleBranchChange = (value: string) => {
    setFilter(prev => ({ ...prev, branch: value || undefined }));
  };

  const handleYearChange = (value: string) => {
    setFilter(prev => ({ ...prev, year: value || undefined }));
  };

  return (
    <div className="space-y-4 bg-muted/30 p-4 rounded-lg">
      <h3 className="text-lg font-medium mb-4">Filter Notes</h3>
      
      <form onSubmit={handleSearch} className="space-y-4">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search by title or content..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="branch">Branch</Label>
            <Select
              value={filter.branch || ""}
              onValueChange={handleBranchChange}
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select branch" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Branches</SelectItem>
                {branches.map((branch) => (
                  <SelectItem key={branch.id} value={branch.id}>
                    {branch.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="year">Year</Label>
            <Select
              value={filter.year || ""}
              onValueChange={handleYearChange}
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select year" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Years</SelectItem>
                {years.map((year) => (
                  <SelectItem key={year.id} value={year.id}>
                    {year.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="flex items-center justify-between pt-2">
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
