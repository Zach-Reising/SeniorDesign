import React, {useRef, useState, useCallback} from 'react';
import { IonContent, IonPage } from '@ionic/react';
import { useHistory } from 'react-router-dom';
import Header from '../components/Header';
import { IonIcon } from '@ionic/react';
import { locationOutline, peopleOutline, statsChartOutline } from 'ionicons/icons';
import './HomePage.css';

const SECTIONS = ['hero', 'features', 'steps', 'cta'];

const HomePage: React.FC = () => {
  const history = useHistory();
  const contentRef = useRef<HTMLIonContentElement>(null);
  const [activeSection, setActiveSection] = useState(0);

  const handleScroll = useCallback(async () => {
    const scrollEl = await contentRef.current?.getScrollElement();
    if (!scrollEl) return;

    const scrollTop = scrollEl.scrollTop;
    const sectionHeight = scrollEl.clientHeight;

    const index = Math.round(scrollTop / sectionHeight);
    setActiveSection(Math.min(index, SECTIONS.length - 1));
  }, []);

  const scrollToSection = async (index: number) => {
    const scrollEl = await contentRef.current?.getScrollElement();
    if (!scrollEl) return;

    const sectionHeight = scrollEl.clientHeight;
    contentRef.current?.scrollToPoint(0, index * sectionHeight, 400);
  };

  return (
    <IonPage>
      <Header />

      {/* Dot navigation */}
      <div className="hp-dot-nav">
        {SECTIONS.map((_, i) => (
          <button
            key={i}
            className={`hp-dot ${activeSection === i ? 'active' : ''}`}
            onClick={() => scrollToSection(i)}
            aria-label={`Go to section ${i + 1}`}
          />
        ))}
      </div>

      <IonContent 
        className="hp-page"
        ref={contentRef}
        scrollEvents={true}
        onIonScroll={handleScroll}  
      >

        <section className="hp-hero">
          <div className="hp-dot-grid" />
          <div className="hp-hero-inner">
            <span className="hp-badge">Crowd Source Litter Pickup</span>
            <h1>Report litter.<br /><span className="hp-accent">Clean up</span> your community.</h1>
            <p>Pin spots on the map, track cleanup events, and connect with others who care.</p>
            <div className="hp-buttons">
              <button className="hp-btn-primary" onClick={() => history.push('/map')}>Open the map</button>
              <button className="hp-btn-secondary" onClick={() => document.getElementById('hp-how')?.scrollIntoView({ behavior: 'smooth' })}>
                Learn how it works
              </button>
            </div>
          </div>
        </section>

        <section className="hp-features-section">
          <div className="hp-features-inner">
            <p className="hp-section-label">Why it works</p>
            <h2 className="hp-section-title">Simple, effective, and community-driven</h2>
            <div className="hp-cards">
              {[
                { icon: locationOutline,     title: 'Pin it on the map',        body: 'Use the GPS on your device or tap a location on the map to report an area. Add photos and a description to let others know about it.' },
                { icon: peopleOutline,     title: 'Join organizations',       body: 'Join an organization or create your own to collaborate with others in your area. participate in events to help make a difference.' },
                { icon: statsChartOutline, title: 'Measure real impact',      body: 'Every report you file moves the needle. Live stats show collective progress.' },
              ].map(c => (
                <div className="hp-card" key={c.title}>
                  <div className = 'hp-card-icon'>
                    <IonIcon icon={c.icon}/>
                  </div>
                  <h3>{c.title}</h3>
                  <p>{c.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="hp-steps-section" id="hp-how">
          <div className="hp-steps-inner">
            <p className="hp-section-label">Getting started</p>
            <h2 className="hp-section-title">Three steps to make a difference</h2>
            <div className="hp-steps-grid">
              {[
                { n: '1', title: 'Create an account',   body: 'Sign up in under a minute with your email or social login.' },
                { n: '2', title: 'Find a litter spot',  body: 'Browse the map or use your GPS to report something you spotted nearby.' },
                { n: '3', title: 'Submit your report',  body: 'Add a photo and details. Your pin goes live instantly for others to see.' },
              ].map(s => (
                <div className="hp-step" key={s.n}>
                  <div className="hp-step-num">{s.n}</div>
                  <h4>{s.title}</h4>
                  <p>{s.body}</p>
                </div>
              ))}
          </div>
          </div>
        </section>

        <section className="hp-cta-section">
          <div className="hp-cta-inner">
            <h2>Ready to make your neighborhood cleaner?</h2>
            <p>Join thousands of others already mapping litter and driving real change.</p>
            <button className="hp-btn-primary hp-btn-lg" onClick={() => history.push('/map')}>
              Get started
            </button>
          </div>
        </section>

      </IonContent>
    </IonPage>
  );
};

export default HomePage;