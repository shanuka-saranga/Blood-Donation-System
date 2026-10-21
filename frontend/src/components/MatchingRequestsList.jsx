import { useEffect, useState } from "react";
import axios from "axios";

const API_BASE_URL = "http://localhost:5000/api/requests";

function MatchingRequestsList({ onActivityChanged }) {
  const [requests, setRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [acceptingRequestId, setAcceptingRequestId] = useState(null);

  useEffect(() => {
    const fetchMatchingRequests = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/matching`, {
          headers: { Authorization: "Bearer " + localStorage.getItem("token") },
        });
        const matchingRequests = response.data.requests || response.data;
        setRequests(Array.isArray(matchingRequests) ? matchingRequests : []);
      } catch (requestError) {
        setError(requestError.response?.data?.message || "Unable to load matching requests.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchMatchingRequests();
  }, []);

  const handleAcceptRequest = async (requestId) => {
    setAcceptingRequestId(requestId);
    setError("");

    try {
      await axios.post(`${API_BASE_URL}/${requestId}/accept`, {}, {
        headers: { Authorization: "Bearer " + localStorage.getItem("token") },
      });
      setRequests((currentRequests) => currentRequests.filter((request) => request.id !== requestId));
      onActivityChanged?.();
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to accept this request.");
    } finally {
      setAcceptingRequestId(null);
    }
  };

  if (isLoading) {
    return (
      <section className="matching-requests-panel dashboard-panel" aria-busy="true">
        <div className="panel-heading">
          <div>
            <p className="panel-eyebrow">Help nearby</p>
            <h2>Matching requests</h2>
          </div>
        </div>
        <p className="matching-requests-message">Loading matching requests...</p>
      </section>
    );
  }

  return (
    <section className="matching-requests-panel dashboard-panel">
      <div className="panel-heading">
        <div>
          <p className="panel-eyebrow">Help nearby</p>
          <h2>Matching requests</h2>
        </div>
        <span className="matching-requests-count">{requests.length}</span>
      </div>
      {error && <p className="matching-requests-error" role="alert">{error}</p>}
      {requests.length === 0 ? (
        <p className="matching-requests-message">There are no matching blood requests right now.</p>
      ) : (
        <div className="matching-requests-list">
          {requests.map((request) => {
            const requestId = request.id || request.requestId;
            const urgency = request.urgency || "Standard";
            return (
              <article className="matching-request-card" key={requestId}>
                <div className="matching-request-card-header">
                  <span className={`matching-request-urgency matching-request-urgency-${urgency.toLowerCase()}`}>
                    {urgency}
                  </span>
                  <span className="matching-request-blood-group">{request.blood_group || request.bloodGroup || "Blood needed"}</span>
                </div>
                <h3>{request.hospital_name || request.hospitalName || "Hospital not provided"}</h3>
                <p className="matching-request-units">
                  <strong>{request.units_required || request.unitsRequired || 0}</strong> units required
                </p>
                <button
                  className="matching-request-accept"
                  disabled={acceptingRequestId === requestId}
                  onClick={() => handleAcceptRequest(requestId)}
                  type="button"
                >
                  {acceptingRequestId === requestId ? "Accepting..." : "Accept Request"}
                </button>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

export default MatchingRequestsList;