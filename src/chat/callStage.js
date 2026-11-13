/**
 * Who is presenting on the call stage.
 *
 * While somebody shares a screen, their feed fills the stage uncropped and the camera tiles
 * shrink into a strip, the way Google Meet shows a presentation. A share that has been announced
 * but whose video has not arrived yet keeps the normal grid, so the stage is never blank.
 */
export const findPresenter = (remoteParticipants = [], screenShareUserId = null) => {
    const sharerId = screenShareUserId === null || screenShareUserId === undefined ? "" : String(screenShareUserId);
    if (!sharerId) return null;
    const participants = Array.isArray(remoteParticipants) ? remoteParticipants : [];
    return participants.find(participant => String(participant?.userId) === sharerId && participant?.stream) || null;
};

export const isPresenterTile = (participant, presenter) => (
    Boolean(presenter) && String(participant?.userId) === String(presenter?.userId)
);

export const presenterLabel = (presenter) => (
    presenter ? `${presenter.user?.name || "Someone"} is presenting` : ""
);

export default findPresenter;
