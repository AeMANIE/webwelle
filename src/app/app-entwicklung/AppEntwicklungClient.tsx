'use client';

import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { gsapConfig } from '@/lib/gsap-config';
import Header from '../components/Header';
import Footer from '../components/Footer';
import ScrollToTop from '../components/ScrollToTop';
import CookieBanner from '../components/CookieBanner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Smartphone, 
  Zap, 
  Shield, 
  Users, 
  Calendar,
  ArrowRight,
  Star,
  Target,
  Rocket,
  MessageCircle,
  FileText,
  Palette
} from 'lucide-react';

// GSAP Plugin registrieren
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

export default function AppEntwicklungClient() {