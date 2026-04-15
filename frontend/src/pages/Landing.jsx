import './Landing.css'

function Landing({ onSignIn, onSignUp }) {
  return (
    <main>
      {/* Sign In Section */}
      <section className="section">
          <button className="btn" type="button" onClick={onSignIn}>Sign In</button>
      </section>

      {/* Section 1*/}
      <section className="section">
          <div className="box" aria-label="image" role="img">
              [Image]
          </div>

          <div className="box">
              <h2>Change the way you approach your health</h2>
              <p>text description goes here</p>
              <button className="btn" type="button" onClick={onSignUp}>Sign Up</button>
          </div>
      </section>

      {/* Section 2*/}
      <section className="section">
        <div className="box">Visual Box 1</div>
        <div className="box">Visual Box 2</div>
        <div className="box">Visual Box 3</div>
      </section>

      {/* Section 3*/}
      <section className="section">
        <div className="box">
          <h2>About Us</h2>
          <p>About us description goes here</p>
        </div>
      </section>

      {/* Section 4*/}
      <section className="section">
        <div className="box">
          <h2>An Accessible Tool That Makes Health Approachable...</h2>
          <p>Descriptive text goes here.</p>
        </div>
        <div className="box" aria-label="image" role="img">
          [Image]
        </div>
      </section>

      {/* Section 5*/}
      <section className="section" style={{ flexWrap: 'wrap' }}>
        <div className="box" style={{ flexBasis: '100%' }}>
            <h2>What Makes Us Different</h2>
        </div>

        <div className="box" style={{ flex: '0 0 calc((100% - 3rem) / 4)' }}>Difference Box 1</div>
        <div className="box" style={{ flex: '0 0 calc((100% - 3rem) / 4)' }}>Difference Box 2</div>
        <div className="box" style={{ flex: '0 0 calc((100% - 3rem) / 4)' }}>Difference Box 3</div>
        <div className="box" style={{ flex: '0 0 calc((100% - 3rem) / 4)' }}>Difference Box 4</div>
        <div className="box" style={{ flexBasis: '100%' }}>
          <h2>Your health at your pace</h2>
        </div>
      </section>


      <section className="section" style={{ flexWrap: 'wrap' }}>
        <div className="box" style={{ flexBasis: '100%' }}>
          <h2>Join the Bloom Family!</h2>
        </div>
        <div className="box" style={{ flex: '0 0 calc((100% - 3rem) / 4)' }}>Logo</div>
        <div className="box" style={{ flex: '0 0 calc((100% - 3rem) / 4)' }}>Your Account</div>
        <div className="box" style={{ flex: '0 0 calc((100% - 3rem) / 4)' }}>Contact Us</div>
        <div className="box" style={{ flex: '0 0 calc((100% - 3rem) / 4)' }}>Install our App</div>
      </section>
    </main>
  )
}

export default Landing
