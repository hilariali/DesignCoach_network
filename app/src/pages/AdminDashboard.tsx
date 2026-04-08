import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import * as api from '@/lib/api';
import type { UserProfile, Team, NewsPost } from '@/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getInitials } from '@/lib/utils';
import { Users, Shield, Radio, Activity, LayoutDashboard, Database, ToggleRight, XCircle, Search } from 'lucide-react';

export default function AdminDashboard() {
    const { user } = useAuthStore();
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [teams, setTeams] = useState<Team[]>([]);
    const [news, setNews] = useState<NewsPost[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState<'users' | 'teams' | 'news' | 'reports'>('users');
    const [reports, setReports] = useState<any[]>([]);
    const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
    const [bulkMessage, setBulkMessage] = useState('');

    useEffect(() => {
        const fetchAdminData = async () => {
            try {
                const [usersData, teamsData, newsData, reportsData] = await Promise.all([
                    api.getAllUsers(),
                    api.getAllTeams(),
                    api.getAllNews(),
                    api.getAllReports(),
                ]);
                setUsers(usersData);
                setTeams(teamsData);
                setNews(newsData);
                setReports(reportsData);
            } catch (error) {
                console.error('Failed to load admin data:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchAdminData();
    }, []);

    const filteredUsers = users.filter(
        (u) =>
            u.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            u.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const toggleUserStatus = async (userToToggle: UserProfile) => {
        try {
            if (userToToggle.isTerminated) {
                await api.restoreUser(userToToggle.id);
            } else {
                await api.terminateUser(userToToggle.id);
            }
            setUsers(users.map(u => u.id === userToToggle.id ? { ...u, isTerminated: !u.isTerminated } : u));
        } catch (error) {
            console.error('Failed to toggle user status', error);
        }
    };

    const toggleTeamStatus = async (teamToToggle: Team) => {
        try {
            if (teamToToggle.isTerminated) {
                await api.restoreTeam(teamToToggle.id);
            } else {
                await api.terminateTeam(teamToToggle.id);
            }
            setTeams(teams.map(t => t.id === teamToToggle.id ? { ...t, isTerminated: !t.isTerminated } : t));
        } catch (error) {
            console.error('Failed to toggle team status', error);
        }
    };

    const deleteNewsPost = async (postId: string) => {
        alert(`News post ${postId} deleted. (Mock action)`);
    };

    const resolveReport = async (reportId: string) => {
        try {
            await api.resolveReport(reportId);
            setReports(reports.map(r => r.id === reportId ? { ...r, resolved: true } : r));
        } catch (error) {
            console.error('Failed to resolve report', error);
        }
    };

    const sendBulkMessage = async () => {
        if (!bulkMessage.trim() || selectedUsers.size === 0) return;
        try {
            for (const userId of selectedUsers) {
                const chat = await api.createOrGetDMChat(user!.id, userId);
                await api.saveMessage({
                    id: `msg_${Date.now()}_${Math.random().toString(36).substring(7)}`,
                    chatId: chat.id,
                    senderId: user!.id,
                    senderType: 'user',
                    content: bulkMessage,
                    type: 'text',
                    timestamp: new Date().toISOString()
                });
            }
            alert(`Message sent to ${selectedUsers.size} users.`);
            setBulkMessage('');
            setSelectedUsers(new Set());
        } catch (error) {
            console.error('Failed to send bulk message', error);
        }
    };

    const toggleUserSelection = (userId: string) => {
        const newSet = new Set(selectedUsers);
        if (newSet.has(userId)) {
            newSet.delete(userId);
        } else {
            newSet.add(userId);
        }
        setSelectedUsers(newSet);
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    // Only render if the current user is actually an admin
    if (user?.userType !== 'admin') {
        return (
            <div className="p-8 text-center text-red-600">
                <h1 className="text-3xl font-bold mb-4">Access Denied</h1>
                <p>You do not have Administrator privileges.</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-900 text-gray-100 p-6 font-sans">
            {/* Header */}
            <div className="flex items-center justify-between mb-8 pb-6 border-b border-gray-800">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center shadow-[0_0_15px_rgba(79,70,229,0.5)]">
                        <Shield className="w-7 h-7 text-white" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-white">Master Control</h1>
                        <p className="text-sm text-gray-400">System Administration & Oversight</p>
                    </div>
                </div>
                <div className="flex items-center gap-4 bg-gray-800 px-4 py-2 rounded-full border border-gray-700">
                    <Activity className="w-5 h-5 text-green-400 animate-pulse" />
                    <span className="text-sm font-medium">System Online</span>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-lg relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Users className="w-16 h-16 text-white" />
                    </div>
                    <p className="text-gray-400 text-sm font-medium mb-1">Total Users</p>
                    <p className="text-4xl font-bold text-white">{users.length}</p>
                </div>
                <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-lg relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <LayoutDashboard className="w-16 h-16 text-white" />
                    </div>
                    <p className="text-gray-400 text-sm font-medium mb-1">Active Teams</p>
                    <p className="text-4xl font-bold text-white">{teams.length}</p>
                </div>
                <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-lg relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Radio className="w-16 h-16 text-white" />
                    </div>
                    <p className="text-gray-400 text-sm font-medium mb-1">News Feeds</p>
                    <p className="text-4xl font-bold text-white">{news.length}</p>
                </div>
                <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-lg relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Database className="w-16 h-16 text-white" />
                    </div>
                    <p className="text-gray-400 text-sm font-medium mb-1">Daily Traffic</p>
                    <p className="text-4xl font-bold text-white">~12.4k</p>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="bg-gray-800 rounded-xl border border-gray-700 shadow-xl overflow-hidden flex flex-col h-[600px]">
                <div className="flex border-b border-gray-700 bg-gray-900/50 p-2">
                    {['users', 'teams', 'news', 'reports'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab as typeof activeTab)}
                            className={`px-6 py-3 rounded-lg font-medium text-sm transition-all duration-200 capitalize ${activeTab === tab
                                ? 'bg-indigo-600 text-white shadow-md'
                                : 'text-gray-400 hover:text-white hover:bg-gray-800'
                                }`}
                        >
                            {tab} Oversight
                        </button>
                    ))}
                </div>

                <div className="p-6 flex-1 overflow-y-auto">
                    {/* Users Tab */}
                    {activeTab === 'users' && (
                        <div className="space-y-4">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-xl font-semibold text-white">User Management</h2>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
                                    <input
                                        type="text"
                                        placeholder="Search users..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-10 pr-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-64 text-gray-100"
                                    />
                                </div>
                            </div>

                            <div className="bg-gray-900 rounded-lg overflow-hidden border border-gray-700">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-gray-800 border-b border-gray-700 text-xs uppercase text-gray-400">
                                            <th className="px-6 py-4 font-medium w-12">
                                                <input
                                                    type="checkbox"
                                                    className="rounded border-gray-600 bg-gray-700 text-indigo-500 focus:ring-indigo-500"
                                                    onChange={(e) => {
                                                        if (e.target.checked) {
                                                            setSelectedUsers(new Set(filteredUsers.map(u => u.id)));
                                                        } else {
                                                            setSelectedUsers(new Set());
                                                        }
                                                    }}
                                                    checked={selectedUsers.size === filteredUsers.length && filteredUsers.length > 0}
                                                />
                                            </th>
                                            <th className="px-6 py-4 font-medium">User</th>
                                            <th className="px-6 py-4 font-medium">Role</th>
                                            <th className="px-6 py-4 font-medium">Status</th>
                                            <th className="px-6 py-4 font-medium text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-800">
                                        {filteredUsers.map((u) => (
                                            <tr key={u.id} className={`transition-colors ${u.isTerminated ? 'bg-red-900/20' : 'hover:bg-gray-800/50'}`}>
                                                <td className="px-6 py-4">
                                                    <input
                                                        type="checkbox"
                                                        className="rounded border-gray-600 bg-gray-700 text-indigo-500 focus:ring-indigo-500"
                                                        checked={selectedUsers.has(u.id)}
                                                        onChange={() => toggleUserSelection(u.id)}
                                                    />
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <Avatar className="w-9 h-9 border border-gray-700">
                                                            <AvatarImage src={u.profilePicture} />
                                                            <AvatarFallback className="bg-gray-700">{getInitials(u.fullName)}</AvatarFallback>
                                                        </Avatar>
                                                        <div>
                                                            <p className="font-medium text-sm text-white">{u.fullName}</p>
                                                            <p className="text-xs text-gray-500">{u.email}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${u.userType === 'admin' ? 'bg-purple-100 text-purple-800' :
                                                        u.userType === 'expert' ? 'bg-blue-100 text-blue-800' :
                                                            'bg-gray-100 text-gray-800'
                                                        }`}>
                                                        {u.userType}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    {u.isTerminated ? (
                                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-500/10 text-red-500 border border-red-500/20">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span> Terminated
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-500/10 text-green-400 border border-green-500/20">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-green-400"></span> Active
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <button
                                                        onClick={() => toggleUserStatus(u)}
                                                        className={`p-2 rounded-lg transition-colors border border-transparent hover:border-gray-600 ${u.isTerminated ? 'text-green-400 hover:text-green-300 hover:bg-gray-700' : 'text-red-400 hover:text-red-300 hover:bg-gray-700'}`}
                                                        title={u.isTerminated ? "Restore User" : "Terminate User"}
                                                    >
                                                        <ToggleRight className="w-5 h-5" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                        {filteredUsers.length === 0 && (
                                            <tr>
                                                <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                                                    No users found matching "{searchTerm}"
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Bulk Action Panel */}
                            {selectedUsers.size > 0 && (
                                <div className="bg-gray-800 p-4 rounded-lg border border-gray-700 flex flex-col gap-3">
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="font-medium text-white">{selectedUsers.size} users selected</span>
                                        <button
                                            onClick={() => setSelectedUsers(new Set())}
                                            className="text-gray-400 hover:text-white"
                                        >
                                            Clear Selection
                                        </button>
                                    </div>
                                    <textarea
                                        value={bulkMessage}
                                        onChange={(e) => setBulkMessage(e.target.value)}
                                        placeholder="Type a message to send to selected users..."
                                        className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-sm text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-none h-24"
                                    />
                                    <div className="flex justify-end">
                                        <button
                                            onClick={sendBulkMessage}
                                            disabled={!bulkMessage.trim()}
                                            className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                                        >
                                            Send Message
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Teams Tab */}
                    {activeTab === 'teams' && (
                        <div className="space-y-4">
                            <h2 className="text-xl font-semibold text-white mb-6">Team Monitor</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {teams.map((team) => (
                                    <div key={team.id} className="bg-gray-900 border border-gray-700 rounded-xl p-5 hover:border-indigo-500/50 transition-colors">
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <h3 className="text-lg font-bold text-white group-hover:text-indigo-400">{team.name}</h3>
                                                <p className="text-sm text-gray-500 line-clamp-1">{team.description}</p>
                                            </div>
                                            <span className="bg-indigo-500/10 text-indigo-400 text-xs px-2.5 py-1 rounded-full border border-indigo-500/20">
                                                {team.members.length} Members
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 mb-4">
                                            <div className="flex -space-x-2">
                                                {team.members.slice(0, 3).map((_, i) => (
                                                    <div key={i} className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center border-2 border-gray-900 text-xs">
                                                        U
                                                    </div>
                                                ))}
                                            </div>
                                            <span className="text-xs text-gray-500">Active participants</span>
                                        </div>
                                        <div className="flex gap-2">
                                            <button className="flex-1 text-sm bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg py-2 transition-colors">
                                                Inspect
                                            </button>
                                            <button
                                                onClick={() => toggleTeamStatus(team)}
                                                className={`flex-1 text-sm rounded-lg py-2 transition-colors ${team.isTerminated ? 'text-green-400 bg-green-500/10 hover:bg-green-500/20 border border-green-500/20' : 'text-red-400 bg-red-400/10 hover:bg-red-400/20 border border-red-400/20'}`}
                                            >
                                                {team.isTerminated ? "Restore" : "Suspend"}
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* News Tab */}
                    {activeTab === 'news' && (
                        <div className="space-y-4">
                            <h2 className="text-xl font-semibold text-white mb-6">Content Moderation</h2>
                            <div className="space-y-4">
                                {news.map((post) => (
                                    <div key={post.id} className="bg-gray-900 border border-gray-700 rounded-xl p-5 flex items-start justify-between gap-4 group">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="text-xs text-indigo-400 font-medium">Post ID: {post.id}</span>
                                                <span className="text-xs text-gray-500">•</span>
                                                <span className="text-xs text-gray-400">{new Date(post.timestamp).toLocaleString()}</span>
                                            </div>
                                            <p className="text-gray-200 text-sm whitespace-pre-wrap">{post.content}</p>
                                            {post.image && (
                                                <div className="mt-3 text-xs text-blue-400 flex items-center gap-1">
                                                    <span>[Attached Image Detected]</span>
                                                </div>
                                            )}
                                        </div>
                                        <button
                                            onClick={() => deleteNewsPost(post.id)}
                                            className="opacity-0 group-hover:opacity-100 p-2 text-red-400 hover:text-white hover:bg-red-500 rounded-lg transition-all border border-red-500/20 hover:border-transparent"
                                            title="Remove Content"
                                        >
                                            <XCircle className="w-5 h-5" />
                                        </button>
                                    </div>
                                ))}
                                {news.length === 0 && (
                                    <div className="text-center py-12 text-gray-500 border border-dashed border-gray-700 rounded-xl bg-gray-900/50">
                                        No content to moderate
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                    {/* Reports Tab */}
                    {activeTab === 'reports' && (
                        <div className="space-y-4">
                            <h2 className="text-xl font-semibold text-white mb-6">User Reports</h2>
                            <div className="bg-gray-900 rounded-lg overflow-hidden border border-gray-700">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-gray-800 border-b border-gray-700 text-xs uppercase text-gray-400">
                                            <th className="px-6 py-4 font-medium">Date</th>
                                            <th className="px-6 py-4 font-medium">Reporter</th>
                                            <th className="px-6 py-4 font-medium">Reported User</th>
                                            <th className="px-6 py-4 font-medium">Reason</th>
                                            <th className="px-6 py-4 font-medium">Status</th>
                                            <th className="px-6 py-4 font-medium text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-800">
                                        {reports.map((report) => {
                                            const reporter = users.find(u => u.id === report.reporterId);
                                            const reportedUser = users.find(u => u.id === report.reportedUserId);
                                            return (
                                                <tr key={report.id} className="hover:bg-gray-800/50 transition-colors">
                                                    <td className="px-6 py-4 text-xs text-gray-400">
                                                        {new Date(report.timestamp).toLocaleString()}
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-white">
                                                        {reporter?.fullName || 'Unknown'}
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-white">
                                                        {reportedUser?.fullName || 'Unknown'}
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-gray-300">
                                                        {report.reason}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        {report.resolved ? (
                                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-500/10 text-green-400 border border-green-500/20">
                                                                Resolved
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-500/10 text-yellow-500 border border-yellow-500/20">
                                                                Pending
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        {!report.resolved && (
                                                            <button
                                                                onClick={() => resolveReport(report.id)}
                                                                className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg transition-colors border border-transparent"
                                                            >
                                                                Mark Resolved
                                                            </button>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                        {reports.length === 0 && (
                                            <tr>
                                                <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                                                    No reports found
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
