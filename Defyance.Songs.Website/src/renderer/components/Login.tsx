import React, { useState } from 'react';
import { supabase } from '../supabase';
import { theme } from '../styles';

interface LoginProps {
  styles: { [key: string]: React.CSSProperties };
  onGuest?: () => void;
}

export const Login: React.FC<LoginProps> = ({ styles, onGuest }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSignUp, setIsSignUp] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { error } = isSignUp 
        ? await supabase.auth.signUp({ email, password })
        : await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      if (isSignUp) alert('Check your email for the confirmation link!');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh', 
      background: theme.background 
    }}>
      <div style={{ ...styles.card, width: '100%', maxWidth: 400 }}>
        <h1 style={{ ...styles.heading, textAlign: 'center', marginBottom: 24 }}>
          {isSignUp ? 'Create Account' : 'Sign In'}
        </h1>
        {error && (
          <div style={{ 
            background: 'rgba(218, 54, 51, 0.1)', 
            border: `1px solid ${theme.danger}`, 
            color: theme.danger, 
            padding: 12, 
            borderRadius: 6, 
            marginBottom: 16,
            fontSize: 14
          }}>
            {error}
          </div>
        )}
        <form onSubmit={handleLogin}>
          <label style={styles.label}>Email</label>
          <input 
            type="email" 
            style={styles.input} 
            value={email} 
            onChange={e => setEmail(e.target.value)} 
            required 
            placeholder="your@email.com"
          />
          <label style={styles.label}>Password</label>
          <input 
            type="password" 
            style={styles.input} 
            value={password} 
            onChange={e => setPassword(e.target.value)} 
            required 
            placeholder="••••••••"
          />
          <button 
            type="submit" 
            disabled={loading}
            style={{ 
              ...styles.button, 
              width: '100%', 
              background: theme.accent, 
              color: '#fff', 
              marginTop: 12,
              padding: '12px'
            }}
          >
            {loading ? 'Processing...' : (isSignUp ? 'Sign Up' : 'Sign In')}
          </button>
        </form>
        <p style={{ 
          textAlign: 'center', 
          marginTop: 20, 
          fontSize: 14, 
          color: theme.muted 
        }}>
          {isSignUp ? 'Already have an account?' : "Don't have an account?"}
          <span 
            onClick={() => setIsSignUp(!isSignUp)}
            style={{ 
              color: theme.accent, 
              cursor: 'pointer', 
              marginLeft: 8,
              fontWeight: 500 
            }}
          >
            {isSignUp ? 'Sign In' : 'Sign Up'}
          </span>
        </p>
        {!isSignUp && onGuest && (
          <div style={{ marginTop: 24, borderTop: `1px solid ${theme.border}`, paddingTop: 20, textAlign: 'center' }}>
            <button 
              onClick={onGuest}
              style={{ ...styles.button, background: 'transparent', color: theme.text, border: `1px solid ${theme.border}`, width: '100%' }}
            >
              Continue as Guest (View Only)
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
