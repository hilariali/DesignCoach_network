import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { useAuthStore } from '@/store/authStore';
import { useProfileStore } from '@/store/profileStore';
import { expertiseDomains, targetCustomers } from '@/data/mockData';
import { getInitials, debounce, getRatingColor } from '@/lib/utils';
import {
  Search, Filter, Bookmark, BookmarkCheck, MessageSquare,
  Star, X, Loader2, Users, Briefcase, ChevronDown
} from 'lucide-react';

export default function UserLookup() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user: currentUser } = useAuthStore();
  const {
    searchResults, isLoading, searchUsers,
    saveProfile, unsaveProfile, isProfileSaved, sendChatRequest
  } = useProfileStore();

  const [searchName, setSearchName] = useState('');
  const [selectedExpertise, setSelectedExpertise] = useState<string[]>([]);
  const [selectedTarget, setSelectedTarget] = useState<string[]>([]);
  const [selectedExpectation, setSelectedExpectation] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  // Track saved status for each user (async-loaded)
  const [savedMap, setSavedMap] = useState<Record<string, boolean>>({});

  // Dropdown open states for multi-selects
  const [expertiseDropdownOpen, setExpertiseDropdownOpen] = useState(false);
  const [targetDropdownOpen, setTargetDropdownOpen] = useState(false);

  useEffect(() => {
    // Initial load - search with no filters
    searchUsers({});
  }, []);

  useEffect(() => {
    const debouncedSearch = debounce(() => {
      searchUsers({
        name: searchName || undefined,
        expertise: selectedExpertise.length > 0 ? selectedExpertise : undefined,
        targetCustomers: selectedTarget.length > 0 ? selectedTarget : undefined,
        expectation: selectedExpectation.length > 0 ? selectedExpectation as any : undefined,
      });
    }, 300);

    debouncedSearch();
  }, [searchName, selectedExpertise, selectedTarget, selectedExpectation]);

  // Local filtering for expectations (since the store may not support it yet)
  const filteredResults = searchResults.filter((user) => {
    if (user.id === currentUser?.id) return false;
    if (selectedExpectation.length > 0) {
      const userExpectation = (user as any).expectation || 'team_up';
      if (!selectedExpectation.includes(userExpectation)) return false;
    }
    return true;
  });

  // Load saved status for visible search results
  useEffect(() => {
    if (!currentUser || searchResults.length === 0) return;
    searchResults.forEach((user) => {
      if (user.id !== currentUser.id && savedMap[user.id] === undefined) {
        isProfileSaved(currentUser.id, user.id).then((saved) => {
          setSavedMap((prev) => ({ ...prev, [user.id]: saved }));
        });
      }
    });
  }, [searchResults, currentUser]);

  const handleSaveToggle = async (userId: string) => {
    if (!currentUser) return;
    if (savedMap[userId]) {
      await unsaveProfile(currentUser.id, userId);
      setSavedMap((prev) => ({ ...prev, [userId]: false }));
      toast({ title: 'Profile removed from saved' });
    } else {
      await saveProfile(currentUser.id, userId);
      setSavedMap((prev) => ({ ...prev, [userId]: true }));
      toast({ title: 'Profile saved!' });
    }
  };

  const handleChatRequest = async (userId: string) => {
    if (!currentUser) return;
    const success = await sendChatRequest(userId);
    if (success) {
      toast({ title: 'Chat started!', description: 'Opening your conversation...' });
      const chatId = [currentUser.id, userId].sort().join('_dm_');
      navigate(`/chat/${chatId}`);
    }
  };

  const clearFilters = () => {
    setSearchName('');
    setSelectedExpertise([]);
    setSelectedTarget([]);
    setSelectedExpectation([]);
  };

  const toggleMultiSelect = (
    current: string[],
    setter: React.Dispatch<React.SetStateAction<string[]>>,
    value: string
  ) => {
    if (current.includes(value)) {
      setter(current.filter((v) => v !== value));
    } else {
      setter([...current, value]);
    }
  };

  const hasFilters = searchName || selectedExpertise.length > 0 || selectedTarget.length > 0 || selectedExpectation.length > 0;
  const activeFilterCount = (selectedExpertise.length > 0 ? 1 : 0) + (selectedTarget.length > 0 ? 1 : 0) + (selectedExpectation.length > 0 ? 1 : 0);

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold">Find People</h1>
              <p className="text-sm text-gray-500">Search for team members and collaborators</p>
            </div>
            <Button
              variant={showFilters ? 'secondary' : 'outline'}
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="relative"
            >
              <Filter className="w-4 h-4 mr-2" />
              Filters
              {activeFilterCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-blue-600 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </Button>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by name..."
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Filter Panel */}
          {showFilters && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg space-y-4">
              {/* Expectation Filter */}
              <div>
                <label className="text-sm font-medium mb-2 block">Looking to...</label>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => toggleMultiSelect(selectedExpectation, setSelectedExpectation, 'team_up')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm border transition-colors ${selectedExpectation.includes('team_up')
                        ? 'bg-blue-100 border-blue-400 text-blue-700'
                        : 'bg-white border-gray-200 text-gray-600 hover:border-blue-300'
                      }`}
                  >
                    <Users className="w-3.5 h-3.5" />
                    Team Up
                  </button>
                  <button
                    onClick={() => toggleMultiSelect(selectedExpectation, setSelectedExpectation, 'work_for_others')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm border transition-colors ${selectedExpectation.includes('work_for_others')
                        ? 'bg-green-100 border-green-400 text-green-700'
                        : 'bg-white border-gray-200 text-gray-600 hover:border-green-300'
                      }`}
                  >
                    <Briefcase className="w-3.5 h-3.5" />
                    Work for Others
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Expertise Multi-Select */}
                <div>
                  <label className="text-sm font-medium mb-1 block">Expertise</label>
                  <div className="relative">
                    <button
                      onClick={() => { setExpertiseDropdownOpen(!expertiseDropdownOpen); setTargetDropdownOpen(false); }}
                      className="w-full flex items-center justify-between border rounded-md px-3 py-2 text-sm bg-white hover:bg-gray-50"
                    >
                      <span className="truncate text-left">
                        {selectedExpertise.length === 0 ? 'All expertise' : `${selectedExpertise.length} selected`}
                      </span>
                      <ChevronDown className="w-4 h-4 ml-2 flex-shrink-0" />
                    </button>
                    {expertiseDropdownOpen && (
                      <div className="absolute z-20 mt-1 w-full bg-white border rounded-md shadow-lg max-h-48 overflow-y-auto">
                        {expertiseDomains.map((exp) => (
                          <label
                            key={exp}
                            className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 cursor-pointer text-sm"
                          >
                            <input
                              type="checkbox"
                              checked={selectedExpertise.includes(exp)}
                              onChange={() => toggleMultiSelect(selectedExpertise, setSelectedExpertise, exp)}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            {exp}
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                  {/* Selected tags */}
                  {selectedExpertise.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {selectedExpertise.map((exp) => (
                        <Badge
                          key={exp}
                          variant="secondary"
                          className="text-xs cursor-pointer hover:bg-red-100"
                          onClick={() => toggleMultiSelect(selectedExpertise, setSelectedExpertise, exp)}
                        >
                          {exp} <X className="w-3 h-3 ml-1" />
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                {/* Target Customers Multi-Select */}
                <div>
                  <label className="text-sm font-medium mb-1 block">Target Customers</label>
                  <div className="relative">
                    <button
                      onClick={() => { setTargetDropdownOpen(!targetDropdownOpen); setExpertiseDropdownOpen(false); }}
                      className="w-full flex items-center justify-between border rounded-md px-3 py-2 text-sm bg-white hover:bg-gray-50"
                    >
                      <span className="truncate text-left">
                        {selectedTarget.length === 0 ? 'All targets' : `${selectedTarget.length} selected`}
                      </span>
                      <ChevronDown className="w-4 h-4 ml-2 flex-shrink-0" />
                    </button>
                    {targetDropdownOpen && (
                      <div className="absolute z-20 mt-1 w-full bg-white border rounded-md shadow-lg max-h-48 overflow-y-auto">
                        {targetCustomers.map((tc) => (
                          <label
                            key={tc}
                            className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 cursor-pointer text-sm"
                          >
                            <input
                              type="checkbox"
                              checked={selectedTarget.includes(tc)}
                              onChange={() => toggleMultiSelect(selectedTarget, setSelectedTarget, tc)}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            {tc}
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                  {/* Selected tags */}
                  {selectedTarget.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {selectedTarget.map((tc) => (
                        <Badge
                          key={tc}
                          variant="secondary"
                          className="text-xs cursor-pointer hover:bg-red-100"
                          onClick={() => toggleMultiSelect(selectedTarget, setSelectedTarget, tc)}
                        >
                          {tc} <X className="w-3 h-3 ml-1" />
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {hasFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  <X className="w-4 h-4 mr-1" />
                  Clear all filters
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Results */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm text-gray-500">
            {isLoading ? 'Searching...' : `${filteredResults.length} results found`}
          </span>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : (
          <div className="space-y-4">
            {filteredResults.map((user) => {
              const expectation = (user as any).expectation || 'team_up';
              return (
                <Card
                  key={user.id}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => navigate(`/profile/${user.id}`)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <Avatar className="w-14 h-14">
                        <AvatarImage src={user.profilePicture} />
                        <AvatarFallback className="bg-blue-100">
                          {getInitials(user.fullName)}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold truncate">{user.fullName}</h3>
                          {user.userType === 'expert' && (
                            <Badge className="bg-purple-100 text-purple-700 text-xs">Expert</Badge>
                          )}
                          <span className={`text-sm flex items-center gap-0.5 ${getRatingColor(user.rating.overall)}`}>
                            <Star className="w-3 h-3" />
                            {user.rating.overall.toFixed(1)}
                          </span>
                          <Badge
                            className={`text-xs ${expectation === 'team_up'
                                ? 'bg-blue-50 text-blue-600 border-blue-200'
                                : 'bg-green-50 text-green-600 border-green-200'
                              }`}
                            variant="outline"
                          >
                            {expectation === 'team_up' ? (
                              <><Users className="w-3 h-3 mr-1" />Team Up</>
                            ) : (
                              <><Briefcase className="w-3 h-3 mr-1" />Work for Others</>
                            )}
                          </Badge>
                        </div>

                        <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                          {user.bio || 'No bio provided.'}
                        </p>

                        <div className="flex flex-wrap gap-1 mt-2">
                          {user.expertiseDomains.slice(0, 3).map((exp, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">{exp}</Badge>
                          ))}
                          {user.expertiseDomains.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{user.expertiseDomains.length - 3}
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleSaveToggle(user.id)}
                        >
                          {savedMap[user.id] ? (
                            <BookmarkCheck className="w-4 h-4 text-blue-600" />
                          ) : (
                            <Bookmark className="w-4 h-4" />
                          )}
                        </Button>
                        <Button
                          size="icon"
                          onClick={() => handleChatRequest(user.id)}
                        >
                          <MessageSquare className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            {filteredResults.length === 0 && !isLoading && (
              <div className="text-center py-12">
                <Search className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-700">No users found</h3>
                <p className="text-gray-500 mt-1">Try adjusting your search or filters</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
