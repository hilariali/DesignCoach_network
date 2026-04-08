import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuthStore } from '@/store/authStore';
import * as api from '@/lib/api';
import { ArrowLeft, Calendar, Sparkles, Printer } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import type { BusinessCanvasVersion, Team } from '@/types';

export default function BusinessCanvasView() {
    const { canvasId } = useParams();
    const navigate = useNavigate();
    useAuthStore();

    const [canvas, setCanvas] = useState<BusinessCanvasVersion | null>(null);
    const [team, setTeam] = useState<Team | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (canvasId) {
            api.getCanvasById(canvasId).then((c) => {
                setCanvas(c || null);
                if (c?.teamId) {
                    api.getTeamById(c.teamId).then((t) => setTeam(t || null));
                }
                setLoading(false);
            });
        } else {
            setLoading(false);
        }
    }, [canvasId]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="text-center">
                    <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
                    <p className="text-gray-500 mt-4">Loading canvas...</p>
                </div>
            </div>
        );
    }

    if (!canvas) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-700">Canvas not found</h2>
                    <p className="text-gray-500 mt-2">This business canvas does not exist.</p>
                    <Button onClick={() => navigate(-1)} className="mt-4">
                        Go Back
                    </Button>
                </div>
            </div>
        );
    }

    const handlePrint = () => {
        const iframe = document.getElementById('canvas-iframe') as HTMLIFrameElement;
        if (iframe?.contentWindow) {
            iframe.contentWindow.print();
        }
    };

    return (
        <div className="h-screen flex flex-col bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b px-4 py-3 shadow-sm flex-shrink-0">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                        <div>
                            <div className="flex items-center gap-2">
                                <h2 className="font-semibold text-lg">
                                    {team?.name || 'Team'} — Business Model Canvas
                                </h2>
                                <Badge className="bg-blue-100 text-blue-700">
                                    v{canvas.version}
                                </Badge>
                            </div>
                            <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
                                <span className="flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    {formatDate(canvas.generatedAt)}
                                </span>
                                <span className="flex items-center gap-1">
                                    <Sparkles className="w-3 h-3" />
                                    AI Generated
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={handlePrint}>
                            <Printer className="w-4 h-4 mr-2" />
                            Print
                        </Button>
                        {team && (
                            <Button
                                size="sm"
                                onClick={() => navigate(`/teams/${team.id}`)}
                            >
                                View Team
                            </Button>
                        )}
                    </div>
                </div>
            </div>

            {/* Summary */}
            {canvas.summary && (
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 border-b px-4 py-2 flex-shrink-0">
                    <div className="max-w-7xl mx-auto">
                        <p className="text-sm text-gray-700">
                            <strong>Summary:</strong> {canvas.summary}
                        </p>
                    </div>
                </div>
            )}

            {/* Canvas iframe */}
            <div className="flex-1 p-4">
                <div className="max-w-7xl mx-auto h-full">
                    <iframe
                        id="canvas-iframe"
                        srcDoc={canvas.htmlContent}
                        title={`Business Model Canvas v${canvas.version}`}
                        className="w-full h-full border rounded-xl shadow-lg bg-white"
                        sandbox="allow-same-origin"
                        style={{ minHeight: '600px' }}
                    />
                </div>
            </div>
        </div>
    );
}
