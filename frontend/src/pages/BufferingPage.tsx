import bufferingImage from '../assets/buffering.gif'

export const BufferingPage = () => (
  <main className="buffering-page" aria-live="polite">
    <div className="buffering-content">
      <img className="buffering-image" src={bufferingImage} alt="A person waiting at a laptop" />
      <h1>Wait a while</h1>
      <p>We are waiting for the server to start.</p>
      <span className="buffering-indicator" aria-hidden="true" />
    </div>
  </main>
)