import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../../api/axios'
import { toast } from 'react-toastify'
import { 
  HiOutlineUser, HiOutlineClock, HiOutlineChevronLeft, HiOutlineChatBubbleBottomCenterText,
  HiOutlineArrowPath, HiOutlineExclamationTriangle, HiStar 
} from 'react-icons/hi2'

export default function CustomerTicketDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [ticket, setTicket] = useState(null)
  const [loading, setLoading] = useState(true)
  const [commentText, setCommentText] = useState('')
  const [submittingComment, setSubmittingComment] = useState(false)

  // Rating States
  const [rating, setRating] = useState(5)
  const [feedbackComment, setFeedbackComment] = useState('')
  const [submittingFeedback, setSubmittingFeedback] = useState(false)

  useEffect(() => {
    fetchTicket()
  }, [id])

  const fetchTicket = async () => {
    setLoading(true)
    try {
      const res = await api.get(`/customer/tickets/${id}`)
      setTicket(res.data)
    } catch {
      toast.error('Failed to load ticket details')
    } finally {
      setLoading(false)
    }
  }

  const handleAddComment = async (e) => {
    e.preventDefault()
    if (!commentText.trim()) return

    setSubmittingComment(true)
    try {
      const res = await api.post(`/customer/tickets/${id}/comment`, { comment: commentText })
      setTicket(res.data)
      setCommentText('')
      toast.success('Comment added successfully')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit comment')
    } finally {
      setSubmittingComment(false)
    }
  }

  const handleRateResolution = async (e) => {
    e.preventDefault()
    setSubmittingFeedback(true)
    try {
      await api.post(`/customer/tickets/${id}/rate`, {
        rating,
        comment: feedbackComment
      })
      toast.success('Feedback submitted successfully!')
      fetchTicket()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit feedback')
    } finally {
      setSubmittingFeedback(false)
    }
  }

  const handleReopenTicket = async () => {
    if (!window.confirm('Are you sure you want to reopen this ticket?')) return
    try {
      const res = await api.post(`/customer/tickets/${id}/reopen`)
      setTicket(res.data)
      toast.success('Ticket has been reopened')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reopen ticket')
    }
  }

  const isClosed = ticket?.status === 'CLOSED'
  const isResolved = ticket?.status === 'RESOLVED'
  const isOpenOrActive = ticket?.status === 'OPEN' || ticket?.status === 'ASSIGNED' || ticket?.status === 'IN_PROGRESS' || ticket?.status === 'REOPENED'

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="animate-spin h-10 w-10 border-4 border-primary-500 border-t-transparent rounded-full"></div>
      </div>
    )
  }

  if (!ticket) {
    return (
      <div className="text-center py-24 glass-card max-w-xl mx-auto space-y-4">
        <HiOutlineExclamationTriangle className="w-16 h-16 text-amber-500 mx-auto" />
        <h3 className="text-lg font-bold text-surface-900 dark:text-white">Ticket Not Found</h3>
        <p className="text-sm text-surface-500">The ticket you are looking for does not exist or has been archived.</p>
        <button onClick={() => navigate('/dashboard/customer-tickets')} className="btn-primary">Back to Tickets</button>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl mx-auto">
      {/* Header Navigation */}
      <button 
        onClick={() => navigate('/dashboard/customer-tickets')}
        className="flex items-center gap-1.5 text-xs font-bold text-surface-500 hover:text-surface-900 dark:hover:text-white transition-all bg-transparent border-0 cursor-pointer"
      >
        <HiOutlineChevronLeft className="w-4 h-4" />
        Back to tickets
      </button>

      {/* Ticket Title & Status bar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white dark:bg-surface-800 p-5 rounded-2xl border border-surface-200 dark:border-surface-700/60 shadow-sm">
        <div className="space-y-1 min-w-0">
          <div className="flex items-center gap-3">
            <span className="font-mono text-sm text-surface-400 font-semibold">#{ticket.id}</span>
            <span className={`badge ${ticket.priority === 'CRITICAL' ? 'badge-danger' : ticket.priority === 'HIGH' ? 'badge-warning' : 'badge-info'}`}>
              {ticket.priority} Priority
            </span>
            <span className={`badge ${
              ticket.status === 'RESOLVED' || ticket.status === 'CLOSED' ? 'badge-success' : 'badge-info'
            }`}>
              {ticket.status}
            </span>
          </div>
          <h1 className="text-xl md:text-2xl font-extrabold text-surface-900 dark:text-white truncate">{ticket.title}</h1>
        </div>

        <div className="flex gap-2 flex-shrink-0">
          {isResolved && (
            <button
              onClick={handleReopenTicket}
              className="px-4 py-2 text-xs font-extrabold border border-red-500/30 text-red-500 hover:bg-red-500/5 rounded-xl flex items-center gap-1.5 bg-transparent transition-all"
            >
              <HiOutlineArrowPath className="w-4 h-4 animate-spin-hover" />
              Reopen Request
            </button>
          )}
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Left column: Ticket Info, Comments and Feedbacks */}
        <div className="md:col-span-2 space-y-6">
          {/* Main Info Card */}
          <div className="glass-card p-6 space-y-4">
            <h3 className="font-bold text-base text-surface-900 dark:text-white border-b border-surface-200/50 dark:border-surface-700/50 pb-2">
              Description
            </h3>
            <p className="text-sm leading-relaxed text-surface-700 dark:text-surface-300 whitespace-pre-wrap">
              {ticket.description}
            </p>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pt-4 border-t border-surface-200/50 dark:border-surface-700/50 text-xs">
              <div>
                <span className="text-surface-400 font-semibold">Category</span>
                <p className="font-semibold text-surface-750 dark:text-surface-200 mt-0.5">{ticket.category || 'Other'}</p>
              </div>
              <div>
                <span className="text-surface-400 font-semibold">Department</span>
                <p className="font-semibold text-surface-750 dark:text-surface-200 mt-0.5">{ticket.departmentName}</p>
              </div>
              <div>
                <span className="text-surface-400 font-semibold">Submitted Date & Time</span>
                <p className="font-semibold text-surface-750 dark:text-surface-200 mt-0.5">{new Date(ticket.createdAt).toLocaleString()}</p>
              </div>
              <div>
                <span className="text-surface-400 font-semibold">Solved Date & Time</span>
                <p className={`font-semibold mt-0.5 ${ticket.status === 'RESOLVED' || ticket.status === 'CLOSED' ? 'text-emerald-600 dark:text-emerald-400' : 'text-surface-750 dark:text-surface-200'}`}>
                  {ticket.resolvedAt ? new Date(ticket.resolvedAt).toLocaleString() : ((ticket.status === 'RESOLVED' || ticket.status === 'CLOSED') ? new Date(ticket.updatedAt).toLocaleString() : 'In Progress')}
                </p>
              </div>
              {ticket.slaResolutionDeadline && (
                <div>
                  <span className="text-surface-400 font-semibold">SLA Deadline</span>
                  <p className={`font-semibold mt-0.5 ${ticket.slaResolutionBreached ? 'text-red-500' : 'text-surface-750 dark:text-surface-200'}`}>
                    {new Date(ticket.slaResolutionDeadline).toLocaleString()}
                    {ticket.slaResolutionBreached && <span className="ml-1 text-[9px] font-bold text-red-500">(BREACHED)</span>}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Rating Section if Resolved or Closed */}
          {(isResolved || isClosed) && !ticket.feedback && (
            <form onSubmit={handleRateResolution} className="glass-card p-6 border-2 border-purple-500/20 bg-purple-500/5 space-y-4">
              <div>
                <h3 className="font-extrabold text-base text-purple-700 dark:text-purple-400">Rate Ticket Resolution</h3>
                <p className="text-xs text-surface-500">Your feedback helps us monitor service quality and award performance points.</p>
              </div>

              {/* Star Rating Select */}
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="p-1 hover:scale-115 transition-transform bg-transparent border-0 cursor-pointer"
                  >
                    <HiStar className={`w-8 h-8 ${star <= rating ? 'text-amber-500' : 'text-surface-300 dark:text-surface-600'}`} />
                  </button>
                ))}
                <span className="text-xs font-bold text-surface-600 ml-2">({rating} / 5 Stars)</span>
              </div>

              <div>
                <label className="label">Optional Comment</label>
                <textarea
                  value={feedbackComment}
                  onChange={e => setFeedbackComment(e.target.value)}
                  className="input-field min-h-20"
                  placeholder="Share details about your service experience..."
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={submittingFeedback}
                  className="px-4 py-2 text-xs font-bold bg-purple-500 hover:bg-purple-600 text-white rounded-xl cursor-pointer disabled:opacity-50 transition-all border-0 shadow"
                >
                  {submittingFeedback ? 'Submitting...' : 'Submit Review'}
                </button>
              </div>
            </form>
          )}

          {/* Feedback Displayed if Rated */}
          {ticket.feedback && (
            <div className="glass-card p-6 bg-emerald-500/5 border border-emerald-500/20 space-y-3">
              <h3 className="font-bold text-sm text-emerald-700 dark:text-emerald-400">Feedback Submitted</h3>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <HiStar key={star} className={`w-4 h-4 ${star <= ticket.feedback.rating ? 'text-amber-500' : 'text-surface-300 dark:text-surface-600'}`} />
                ))}
              </div>
              {ticket.feedback.comment && (
                <p className="text-xs italic text-surface-600 dark:text-surface-300">"{ticket.feedback.comment}"</p>
              )}
              <span className="text-[10px] text-surface-400 block">Submitted on {new Date(ticket.feedback.createdAt).toLocaleDateString()}</span>
            </div>
          )}

          {/* Comments/History Section */}
          <div className="glass-card p-6 space-y-4">
            <h3 className="font-bold text-base text-surface-900 dark:text-white flex items-center gap-2">
              <HiOutlineChatBubbleBottomCenterText className="w-5 h-5 text-primary-500" />
              Timeline & Conversation
            </h3>

            {/* Input Comment Box */}
            {isOpenOrActive && (
              <form onSubmit={handleAddComment} className="flex gap-2">
                <input
                  type="text"
                  value={commentText}
                  onChange={e => setCommentText(e.target.value)}
                  placeholder="Ask for an update, reply to agent or attach information..."
                  className="input-field flex-1 text-xs"
                  required
                />
                <button
                  type="submit"
                  disabled={submittingComment}
                  className="btn-primary text-xs whitespace-nowrap"
                >
                  {submittingComment ? 'Sending...' : 'Send Message'}
                </button>
              </form>
            )}

            {/* List Conversation */}
            <div className="space-y-4 pt-4 border-t border-surface-200/50 dark:border-surface-700/50">
              {ticket.history?.length === 0 ? (
                <p className="text-center py-6 text-xs text-surface-400">No activity logged.</p>
              ) : (
                ticket.history.map((hist) => {
                  const isAgent = hist.changedByRole !== 'CUSTOMER'
                  return (
                    <div 
                      key={hist.id} 
                      className={`flex gap-3 text-xs leading-relaxed max-w-[90%] ${
                        isAgent ? 'mr-auto bg-surface-50 dark:bg-surface-800/40' : 'ml-auto bg-primary-500/5 flex-row-reverse text-right'
                      } p-3 rounded-2xl border border-surface-200/20`}
                    >
                      <div className="space-y-1">
                        <div className={`flex items-center gap-1.5 text-[10px] font-bold ${
                          isAgent ? 'text-primary-500' : 'text-emerald-500'
                        }`}>
                          <HiOutlineUser className="w-3 h-3" />
                          <span>{hist.changedByName}</span>
                          <span className="uppercase text-[8px] px-1 rounded bg-surface-150 text-surface-500">
                            {hist.changedByRole || 'SYSTEM'}
                          </span>
                        </div>
                        <p className="text-surface-750 dark:text-surface-300 font-medium whitespace-pre-wrap">{hist.comment}</p>
                        <span className="text-[9px] text-surface-400 block">{new Date(hist.timestamp).toLocaleString()}</span>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>

        {/* Right column: Assigned Employee info & SLA */}
        <div className="space-y-6">
          {/* Assigned employee contact */}
          <div className="glass-card p-6 space-y-4">
            <h3 className="font-bold text-base text-surface-900 dark:text-white border-b border-surface-200/50 dark:border-surface-700/50 pb-2">
              Assigned Support Agent
            </h3>

            {ticket.assignedToName ? (
              <div className="space-y-3.5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary-500/10 flex items-center justify-center text-primary-500 font-bold">
                    {ticket.assignedToName.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-surface-900 dark:text-white">{ticket.assignedToName}</h4>
                    <p className="text-[10px] text-surface-400">Assigned Resolver</p>
                  </div>
                </div>

                <div className="space-y-1.5 pt-2 text-xs border-t border-surface-200/30">
                  {ticket.raisedByEmail && (
                    <div>
                      <span className="text-[10px] text-surface-400 block">Email Contact</span>
                      <span className="font-semibold text-surface-700 dark:text-surface-300">{ticket.raisedByEmail}</span>
                    </div>
                  )}
                  {ticket.raisedByPhone && (
                    <div>
                      <span className="text-[10px] text-surface-400 block">Phone Contact</span>
                      <span className="font-semibold text-surface-700 dark:text-surface-300">{ticket.raisedByPhone}</span>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-6 text-surface-400 text-xs">
                <HiOutlineClock className="w-8 h-8 mx-auto text-surface-300 mb-1" />
                Awaiting agent matching. Ticket has been queued.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
