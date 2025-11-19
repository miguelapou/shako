import React, { useState, useMemo, useEffect } from 'react';
import { Search, Package, DollarSign, TrendingUp, Truck, CheckCircle, Clock, XCircle, ChevronDown, Plus, X, ExternalLink, ChevronUp, Edit2, Trash2, Moon, Sun, Wrench, List, Target, Calendar } from 'lucide-react';
import { supabase } from '../lib/supabase';

// Add Foundation One font
const fontStyles = `
  @font-face {
    font-family: 'FoundationOne';
    src: url('https://db.onlinewebfonts.com/t/f58c10cd63660152b6858a49e05fe609.woff2') format('woff2'),
         url('https://db.onlinewebfonts.com/t/f58c10cd63660152b6858a49e05fe609.woff') format('woff'),
         url('https://db.onlinewebfonts.com/t/f58c10cd63660152b6858a49e05fe609.ttf') format('truetype');
    font-weight: normal;
    font-style: normal;
    font-display: swap;
  }
`;

const LandCruiserTracker = () => {
  const [parts, setParts] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('parts'); // 'parts' or 'projects'

  // Load parts and projects from Supabase on mount
  useEffect(() => {
    loadParts();
    loadProjects();
  }, []);

  const loadParts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('parts')
        .select('*')
        .order('id', { ascending: true });

      if (error) throw error;

      if (data && data.length > 0) {
        // Convert database format to app format
        const formattedParts = data.map(part => ({
          id: part.id,
          delivered: part.delivered,
          shipped: part.shipped,
          purchased: part.purchased,
          part: part.part,
          partNumber: part.part_number || '',
          vendor: part.vendor || '',
          price: parseFloat(part.price) || 0,
          shipping: parseFloat(part.shipping) || 0,
          duties: parseFloat(part.duties) || 0,
          total: parseFloat(part.total) || 0,
          tracking: part.tracking || '',
          projectId: part.project_id || null
        }));
        setParts(formattedParts);
      } else {
        // If no data, initialize with default data
        await initializeDefaultData();
      }
    } catch (error) {
      console.error('Error loading parts:', error);
      alert('Error loading parts from database');
    } finally {
      setLoading(false);
    }
  };

  const initializeDefaultData = async () => {
    const defaultParts = [
      { id: 1, delivered: true, shipped: true, purchased: true, part: "Cup Holder", partNumber: "-", vendor: "Etsy", price: 52.00, shipping: 0, duties: 0, total: 52.00, tracking: "9434609206094903332736" },
      { id: 2, delivered: false, shipped: true, purchased: true, part: "Sony Stereo", partNumber: "XAV-AX6000", vendor: "Best Buy", price: 436.99, shipping: 0, duties: 0, total: 436.99, tracking: "480723763892" },
      { id: 3, delivered: true, shipped: true, purchased: true, part: "FR Fender Rubber", partNumber: "53878-90K00", vendor: "Partsnext", price: 17.54, shipping: 3.29, duties: 132.65, total: 20.83, tracking: "1Z48537W0440715302" },
      { id: 4, delivered: true, shipped: true, purchased: true, part: "FL Fender Rubber", partNumber: "53879-90K00", vendor: "Partsnext", price: 17.54, shipping: 0, duties: 0, total: 17.54, tracking: "1Z48537W0440715302" },
      { id: 5, delivered: true, shipped: true, purchased: true, part: "RR Fender Rubber", partNumber: "61783-90K00", vendor: "Partsnext", price: 10.68, shipping: 3.29, duties: 0, total: 13.97, tracking: "1Z48537W0440715302" },
      { id: 6, delivered: true, shipped: true, purchased: true, part: "RL Fender Rubber", partNumber: "61784-90K00", vendor: "Partsnext", price: 10.68, shipping: 0, duties: 0, total: 10.68, tracking: "1Z48537W0440715302" },
      { id: 7, delivered: true, shipped: true, purchased: true, part: "Front Grille", partNumber: "53101-60050", vendor: "Partsnext", price: 126.20, shipping: 106.03, duties: 0, total: 232.23, tracking: "1Z48537W0440715302" },
      { id: 8, delivered: true, shipped: true, purchased: true, part: "Gear Shift Knob", partNumber: "33504-24010-C1", vendor: "Partsnext", price: 31.95, shipping: 0, duties: 0, total: 31.95, tracking: "1Z48537W0440715302" },
      { id: 9, delivered: true, shipped: true, purchased: true, part: "Accelerator Pad", partNumber: "78111-95110", vendor: "Partsnext", price: 7.02, shipping: 0, duties: 0, total: 7.02, tracking: "1Z48537W0440715302" },
      { id: 10, delivered: true, shipped: true, purchased: true, part: "Clutch & Brake Pad", partNumber: "31321-14020", vendor: "Partsnext", price: 4.36, shipping: 3.29, duties: 0, total: 7.65, tracking: "1Z48537W0440715302" },
      { id: 11, delivered: false, shipped: false, purchased: true, part: "Steering Wheel (Older)", partNumber: "-", vendor: "eBay", price: 210.00, shipping: 90.00, duties: 0, total: 300.00, tracking: "" },
      { id: 12, delivered: true, shipped: true, purchased: true, part: "Steering Wheel (Original)", partNumber: "-", vendor: "eBay", price: 226.00, shipping: 65.00, duties: 0, total: 291.00, tracking: "885304602390" },
      { id: 13, delivered: true, shipped: true, purchased: true, part: "Transfer Case Knob", partNumber: "36303-60211-C0", vendor: "eBay", price: 21.60, shipping: 18.35, duties: 0, total: 39.95, tracking: "885344165215" },
      { id: 14, delivered: true, shipped: true, purchased: true, part: "Winch Cover", partNumber: "38286-60111", vendor: "eBay", price: 211.10, shipping: 0, duties: 0, total: 211.10, tracking: "885474166695" },
      { id: 15, delivered: true, shipped: true, purchased: true, part: "Fog Light Switch", partNumber: "84160-90K01", vendor: "eBay", price: 42.99, shipping: 0, duties: 0, total: 42.99, tracking: "9400108106245393635087" },
      { id: 16, delivered: true, shipped: true, purchased: true, part: "Diesel Badge", partNumber: "75315-90A02", vendor: "eBay", price: 33.90, shipping: 0, duties: 0, total: 33.90, tracking: "9400150206242016493978" },
      { id: 17, delivered: true, shipped: true, purchased: true, part: "Hitch", partNumber: "-", vendor: "eBay", price: 55.87, shipping: 0, duties: 0, total: 55.87, tracking: "885492205088" },
      { id: 18, delivered: true, shipped: true, purchased: true, part: "4 Pin Trailer Connector", partNumber: "-", vendor: "eBay", price: 29.99, shipping: 8.35, duties: 0, total: 38.34, tracking: "9400108106245426390983" },
      { id: 19, delivered: true, shipped: true, purchased: true, part: "Rear Bumper Step (Split)", partNumber: "51987-60021", vendor: "eBay", price: 85.00, shipping: 18.00, duties: 0, total: 103.00, tracking: "2450562144" },
      { id: 20, delivered: true, shipped: true, purchased: true, part: "Key", partNumber: "90999-00212", vendor: "eBay", price: 16.99, shipping: 0, duties: 0, total: 16.99, tracking: "9234690403371000425709" },
      { id: 21, delivered: false, shipped: true, purchased: true, part: "FR/FL Fender Rubber", partNumber: "53851-90K00-01", vendor: "eBay", price: 65.24, shipping: 22.00, duties: 0, total: 87.24, tracking: "ECSDT00000000052" },
      { id: 22, delivered: false, shipped: false, purchased: true, part: "Rear Door Latch", partNumber: "69206-10050-B0", vendor: "eBay", price: 10.21, shipping: 19.53, duties: 0, total: 29.74, tracking: "" },
      { id: 23, delivered: false, shipped: true, purchased: true, part: "Rear Door Card (LH)", partNumber: "64790-60020-S7", vendor: "eBay", price: 88.85, shipping: 51.81, duties: 0, total: 140.66, tracking: "https://www.fedex.com/fedextrack/?trknbr=885730110967&trkqual=2460984000~885730110967~FX" },
      { id: 24, delivered: false, shipped: true, purchased: true, part: "Rear Door Card (RH)", partNumber: "64780-60050-S7", vendor: "eBay", price: 62.62, shipping: 43.43, duties: 0, total: 106.05, tracking: "https://www.fedex.com/fedextrack/?trknbr=885730110967&trkqual=2460984000~885730110967~FX" },
      { id: 25, delivered: true, shipped: true, purchased: true, part: "RH Belt Cover", partNumber: "71811-60020-B0", vendor: "Toyota", price: 29.01, shipping: 0, duties: 0, total: 29.01, tracking: "Local" },
      { id: 26, delivered: true, shipped: true, purchased: true, part: "LH Belt Cover", partNumber: "71812-60040-B0", vendor: "Toyota", price: 36.38, shipping: 0, duties: 0, total: 36.38, tracking: "Local" },
      { id: 27, delivered: true, shipped: true, purchased: true, part: "Fuel Filter", partNumber: "23303-64010", vendor: "Toyota", price: 15.93, shipping: 0, duties: 0, total: 15.93, tracking: "Local" },
      { id: 28, delivered: true, shipped: true, purchased: true, part: "Oil Filter x 2", partNumber: "90915-30002", vendor: "Toyota", price: 36.77, shipping: 0, duties: 0, total: 36.77, tracking: "Local" },
      { id: 29, delivered: true, shipped: true, purchased: true, part: "Air Filter", partNumber: "17801-68020", vendor: "Toyota", price: 21.24, shipping: 0, duties: 0, total: 21.24, tracking: "Local" },
      { id: 30, delivered: true, shipped: true, purchased: true, part: "LH Inner Belt Assembly", partNumber: "73230-60181-B0", vendor: "Jauce", price: 56.03, shipping: 158.00, duties: 24.27, total: 423.55, tracking: "4730109366" },
      { id: 31, delivered: true, shipped: true, purchased: true, part: "RH Inner Belt Assembly", partNumber: "73230-60151-B0", vendor: "Jauce", price: 56.03, shipping: 0, duties: 0, total: 56.03, tracking: "4730109366" },
      { id: 32, delivered: true, shipped: true, purchased: true, part: "Dash Pad", partNumber: "55401-90K00-B0", vendor: "Jauce", price: 129.22, shipping: 0, duties: 0, total: 129.22, tracking: "4730109366" },
      { id: 33, delivered: true, shipped: true, purchased: true, part: "Front Speakers", partNumber: "DB402", vendor: "Amazon", price: 49.98, shipping: 0, duties: 0, total: 49.98, tracking: "" },
      { id: 34, delivered: true, shipped: true, purchased: true, part: "Rear Speakers", partNumber: "DB652", vendor: "Amazon", price: 69.35, shipping: 0, duties: 0, total: 69.35, tracking: "" },
      { id: 35, delivered: true, shipped: true, purchased: true, part: "Radio Wiring Harness", partNumber: "70-1761", vendor: "Amazon", price: 5.00, shipping: 0, duties: 0, total: 5.00, tracking: "" },
      { id: 36, delivered: false, shipped: true, purchased: true, part: "Oil Plug Gaskets", partNumber: "90430-12031", vendor: "Amazon", price: 14.74, shipping: 0, duties: 0, total: 14.74, tracking: "https://www.amazon.com/gp/your-account/ship-track?itemId=jkohkoonpjkqpsp&ref=ppx_yo2ov_dt_b_track_package&orderId=112-1718718-3841801" },
      { id: 37, delivered: true, shipped: true, purchased: true, part: "5 to 4 Wire Converter", partNumber: "-", vendor: "Amazon", price: 19.99, shipping: 0, duties: 0, total: 19.99, tracking: "https://www.amazon.com/gp/your-account/ship-track?itemId=jkogrpkqljlrqmp&ref=ppx_yo2ov_dt_b_track_package&packageIndex=0&orderId=112-0626844-5673038&shipmentId=PhG9YC6jb" },
      { id: 38, delivered: false, shipped: false, purchased: false, part: "Subwoofer", partNumber: "", vendor: "", price: 0, shipping: 0, duties: 0, total: 0, tracking: "" },
    ];

    try {
      // Insert all default parts
      for (const part of defaultParts) {
        await supabase.from('parts').insert({
          id: part.id,
          delivered: part.delivered,
          shipped: part.shipped,
          purchased: part.purchased,
          part: part.part,
          part_number: part.partNumber,
          vendor: part.vendor,
          price: part.price,
          shipping: part.shipping,
          duties: part.duties,
          total: part.total,
          tracking: part.tracking
        });
      }
      
      // Reload parts after initialization
      await loadParts();
    } catch (error) {
      console.error('Error initializing data:', error);
    }
  };

  // Load projects from Supabase
  const loadProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('id', { ascending: true });

      if (error) throw error;

      if (data && data.length > 0) {
        setProjects(data);
      } else {
        // Initialize with default projects
        await initializeDefaultProjects();
      }
    } catch (error) {
      console.error('Error loading projects:', error);
    }
  };

  const initializeDefaultProjects = async () => {
    const defaultProjects = [
      { 
        name: "Interior Restoration", 
        description: "Complete interior refurbishment including seats, dashboard, and trim",
        status: "in_progress",
        budget: 2000,
        spent: 850,
        start_date: "2024-01-15",
        target_date: "2025-03-01",
        priority: "high"
      },
      { 
        name: "Engine Maintenance", 
        description: "Regular maintenance and upgrades to engine components",
        status: "in_progress",
        budget: 1500,
        spent: 600,
        start_date: "2024-02-01",
        target_date: "2025-06-01",
        priority: "medium"
      },
      { 
        name: "Exterior Body Work", 
        description: "Rust repair, paint, and body panel replacement",
        status: "planning",
        budget: 3500,
        spent: 0,
        start_date: null,
        target_date: "2025-12-01",
        priority: "low"
      }
    ];

    try {
      for (const project of defaultProjects) {
        await supabase.from('projects').insert(project);
      }
      await loadProjects();
    } catch (error) {
      console.error('Error initializing projects:', error);
    }
  };

  const addProject = async (projectData) => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .insert([{
          name: projectData.name,
          description: projectData.description,
          status: projectData.status || 'planning',
          budget: parseFloat(projectData.budget) || 0,
          spent: 0,
          start_date: projectData.start_date || null,
          target_date: projectData.target_date || null,
          priority: projectData.priority || 'medium'
        }])
        .select();

      if (error) throw error;
      await loadProjects();
    } catch (error) {
      console.error('Error adding project:', error);
      alert('Error adding project');
    }
  };

  const updateProject = async (projectId, updates) => {
    try {
      const { error } = await supabase
        .from('projects')
        .update(updates)
        .eq('id', projectId);

      if (error) throw error;
      await loadProjects();
    } catch (error) {
      console.error('Error updating project:', error);
      alert('Error updating project');
    }
  };

  const deleteProject = async (projectId) => {
    if (!confirm('Are you sure you want to delete this project?')) return;
    
    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId);

      if (error) throw error;
      await loadProjects();
    } catch (error) {
      console.error('Error deleting project:', error);
      alert('Error deleting project');
    }
  };

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [vendorFilter, setVendorFilter] = useState('all');
  const [sortBy, setSortBy] = useState('status');
  const [sortOrder, setSortOrder] = useState('asc');
  const [openDropdown, setOpenDropdown] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showTrackingModal, setShowTrackingModal] = useState(false);
  const [trackingModalPartId, setTrackingModalPartId] = useState(null);
  const [trackingInput, setTrackingInput] = useState('');
  const [editingPart, setEditingPart] = useState(null);
  
  // Project-related state
  const [showAddProjectModal, setShowAddProjectModal] = useState(false);
  const [showEditProjectModal, setShowEditProjectModal] = useState(false);
  const [showProjectDetailModal, setShowProjectDetailModal] = useState(false);
  const [viewingProject, setViewingProject] = useState(null);
  const [editingProject, setEditingProject] = useState(null);
  const [newProject, setNewProject] = useState({
    name: '',
    description: '',
    budget: '',
    start_date: '',
    target_date: '',
    priority: 'medium',
    status: 'planning'
  });
  
  const [darkMode, setDarkMode] = useState(() => {
    // Only access localStorage in the browser
    if (typeof window === 'undefined') return false;
    
    // Check localStorage or system preference
    const saved = localStorage.getItem('darkMode');
    if (saved !== null) return JSON.parse(saved);
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  // Save dark mode preference to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('darkMode', JSON.stringify(darkMode));
    }
  }, [darkMode]);

  const [newPart, setNewPart] = useState({
    part: '',
    partNumber: '',
    vendor: '',
    price: '',
    shipping: '',
    duties: '',
    tracking: '',
    status: 'pending',
    projectId: null
  });

  const vendors = useMemo(() => {
    const vendorSet = new Set(parts.map(p => p.vendor).filter(v => v));
    return ['all', ...Array.from(vendorSet).sort()];
  }, [parts]);

  const updatePartStatus = async (partId, newStatus) => {
    // If changing to shipped, show tracking modal
    if (newStatus === 'shipped') {
      setTrackingModalPartId(partId);
      setShowTrackingModal(true);
      setOpenDropdown(null);
      return;
    }
    
    try {
      const statusMap = {
        delivered: { delivered: true, shipped: true, purchased: true },
        purchased: { delivered: false, shipped: false, purchased: true },
        pending: { delivered: false, shipped: false, purchased: false }
      };
      
      const updates = statusMap[newStatus];
      
      // Update in database
      const { error } = await supabase
        .from('parts')
        .update(updates)
        .eq('id', partId);
      
      if (error) throw error;
      
      // Update local state
      setParts(prevParts => prevParts.map(part => {
        if (part.id === partId) {
          return { ...part, ...updates };
        }
        return part;
      }));
      
      setOpenDropdown(null);
    } catch (error) {
      console.error('Error updating part status:', error);
      alert('Error updating part status. Please try again.');
    }
  };

  const saveTrackingInfo = async () => {
    try {
      // Update in database
      const { error } = await supabase
        .from('parts')
        .update({
          delivered: false,
          shipped: true,
          purchased: true,
          tracking: trackingInput
        })
        .eq('id', trackingModalPartId);
      
      if (error) throw error;
      
      // Update local state
      setParts(prevParts => prevParts.map(part => {
        if (part.id === trackingModalPartId) {
          return { 
            ...part, 
            delivered: false, 
            shipped: true, 
            purchased: true,
            tracking: trackingInput 
          };
        }
        return part;
      }));
      
      setShowTrackingModal(false);
      setTrackingModalPartId(null);
      setTrackingInput('');
    } catch (error) {
      console.error('Error saving tracking info:', error);
      alert('Error saving tracking info. Please try again.');
    }
  };

  const skipTrackingInfo = async () => {
    try {
      // Update in database
      const { error } = await supabase
        .from('parts')
        .update({
          delivered: false,
          shipped: true,
          purchased: true
        })
        .eq('id', trackingModalPartId);
      
      if (error) throw error;
      
      // Update local state
      setParts(prevParts => prevParts.map(part => {
        if (part.id === trackingModalPartId) {
          return { 
            ...part, 
            delivered: false, 
            shipped: true, 
            purchased: true
          };
        }
        return part;
      }));
      
      setShowTrackingModal(false);
      setTrackingModalPartId(null);
      setTrackingInput('');
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Error updating status. Please try again.');
    }
  };

  const openEditModal = (part) => {
    setEditingPart({
      ...part,
      status: part.delivered ? 'delivered' : (part.shipped ? 'shipped' : (part.purchased ? 'purchased' : 'pending'))
    });
    setShowEditModal(true);
  };

  const saveEditedPart = async () => {
    const price = parseFloat(editingPart.price) || 0;
    const shipping = parseFloat(editingPart.shipping) || 0;
    const duties = parseFloat(editingPart.duties) || 0;
    const total = price + shipping + duties;
    
    const statusMap = {
      delivered: { delivered: true, shipped: true, purchased: true },
      shipped: { delivered: false, shipped: true, purchased: true },
      purchased: { delivered: false, shipped: false, purchased: true },
      pending: { delivered: false, shipped: false, purchased: false }
    };
    
    try {
      // Update in database
      const { error } = await supabase
        .from('parts')
        .update({
          ...statusMap[editingPart.status],
          part: editingPart.part,
          part_number: editingPart.partNumber,
          vendor: editingPart.vendor,
          price,
          shipping,
          duties,
          total,
          tracking: editingPart.tracking,
          project_id: editingPart.projectId || null
        })
        .eq('id', editingPart.id);
      
      if (error) throw error;
      
      // Update local state
      setParts(prevParts => prevParts.map(part => {
        if (part.id === editingPart.id) {
          return {
            ...part,
            ...statusMap[editingPart.status],
            part: editingPart.part,
            partNumber: editingPart.partNumber,
            vendor: editingPart.vendor,
            price,
            shipping,
            duties,
            total,
            tracking: editingPart.tracking,
            projectId: editingPart.projectId || null
          };
        }
        return part;
      }));
      
      setShowEditModal(false);
      setEditingPart(null);
    } catch (error) {
      console.error('Error saving part:', error);
      alert('Error saving part. Please try again.');
    }
  };

  const deletePart = async (partId) => {
    if (window.confirm('Are you sure you want to delete this part? This action cannot be undone.')) {
      try {
        // Delete from database
        const { error } = await supabase
          .from('parts')
          .delete()
          .eq('id', partId);
        
        if (error) throw error;
        
        // Update local state
        setParts(prevParts => prevParts.filter(part => part.id !== partId));
      } catch (error) {
        console.error('Error deleting part:', error);
        alert('Error deleting part. Please try again.');
      }
    }
  };

  const unlinkPartFromProject = async (partId) => {
    try {
      // Update in database
      const { error } = await supabase
        .from('parts')
        .update({ project_id: null })
        .eq('id', partId);
      
      if (error) throw error;
      
      // Update local state
      setParts(prevParts => prevParts.map(part => 
        part.id === partId ? { ...part, projectId: null } : part
      ));
    } catch (error) {
      console.error('Error unlinking part:', error);
      alert('Error unlinking part. Please try again.');
    }
  };

  const addNewPart = async () => {
    const price = parseFloat(newPart.price) || 0;
    const shipping = parseFloat(newPart.shipping) || 0;
    const duties = parseFloat(newPart.duties) || 0;
    const total = price + shipping + duties;
    
    const statusMap = {
      delivered: { delivered: true, shipped: true, purchased: true },
      shipped: { delivered: false, shipped: true, purchased: true },
      purchased: { delivered: false, shipped: false, purchased: true },
      pending: { delivered: false, shipped: false, purchased: false }
    };
    
    try {
      // Insert into database
      const { data, error } = await supabase
        .from('parts')
        .insert({
          ...statusMap[newPart.status],
          part: newPart.part,
          part_number: newPart.partNumber,
          vendor: newPart.vendor,
          price,
          shipping,
          duties,
          total,
          tracking: newPart.tracking,
          project_id: newPart.projectId || null
        })
        .select()
        .single();
      
      if (error) throw error;
      
      // Add to local state with the ID from database
      const partToAdd = {
        id: data.id,
        ...statusMap[newPart.status],
        part: newPart.part,
        partNumber: newPart.partNumber,
        vendor: newPart.vendor,
        price,
        shipping,
        duties,
        total,
        tracking: newPart.tracking,
        projectId: newPart.projectId || null
      };
      
      setParts([...parts, partToAdd]);
      setShowAddModal(false);
      setNewPart({
        part: '',
        partNumber: '',
        vendor: '',
        price: '',
        shipping: '',
        duties: '',
        tracking: '',
        status: 'pending',
        projectId: null
      });
    } catch (error) {
      console.error('Error adding part:', error);
      alert('Error adding part. Please try again.');
    }
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      // Toggle sort order if clicking the same column
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new sort field with ascending order
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const getSortIcon = (field) => {
    if (sortBy !== field) return null;
    return sortOrder === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />;
  };

  const filteredParts = useMemo(() => {
    return parts
      .filter(part => {
        const matchesSearch = part.part.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            part.partNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            part.vendor.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesStatus = statusFilter === 'all' ||
                             (statusFilter === 'delivered' && part.delivered) ||
                             (statusFilter === 'shipped' && part.shipped && !part.delivered) ||
                             (statusFilter === 'purchased' && part.purchased && !part.shipped) ||
                             (statusFilter === 'pending' && !part.purchased);
        
        const matchesVendor = vendorFilter === 'all' || part.vendor === vendorFilter;
        
        return matchesSearch && matchesStatus && matchesVendor;
      })
      .sort((a, b) => {
        let aVal, bVal;
        
        // Special handling for status sorting
        if (sortBy === 'status') {
          // Assign numeric values: pending=0, purchased=1, shipped=2, delivered=3
          aVal = a.delivered ? 3 : (a.shipped ? 2 : (a.purchased ? 1 : 0));
          bVal = b.delivered ? 3 : (b.shipped ? 2 : (b.purchased ? 1 : 0));
        } else {
          aVal = a[sortBy];
          bVal = b[sortBy];
          
          if (typeof aVal === 'string') {
            aVal = aVal.toLowerCase();
            bVal = bVal.toLowerCase();
          }
        }
        
        if (sortOrder === 'asc') {
          return aVal > bVal ? 1 : -1;
        } else {
          return aVal < bVal ? 1 : -1;
        }
      });
  }, [parts, searchTerm, statusFilter, vendorFilter, sortBy, sortOrder]);

  // Get unique vendors from existing parts for the dropdown
  const uniqueVendors = useMemo(() => {
    const vendors = parts
      .map(p => p.vendor)
      .filter(v => v && v.trim() !== '')
      .filter((v, i, arr) => arr.indexOf(v) === i) // unique values
      .sort();
    return vendors;
  }, [parts]);

  const stats = useMemo(() => {
    // Filter out pending items (items where purchased is false) for cost calculations
    const purchasedParts = parts.filter(p => p.purchased);
    
    return {
      total: parts.length,
      delivered: parts.filter(p => p.delivered).length,
      shipped: parts.filter(p => p.shipped && !p.delivered).length,
      purchased: parts.filter(p => p.purchased && !p.shipped).length,
      pending: parts.filter(p => !p.purchased).length,
      totalCost: purchasedParts.reduce((sum, p) => sum + p.total, 0),
      totalPrice: purchasedParts.reduce((sum, p) => sum + p.price, 0),
      totalShipping: purchasedParts.reduce((sum, p) => sum + p.shipping, 0),
      totalDuties: purchasedParts.reduce((sum, p) => sum + p.duties, 0),
    };
  }, [parts]);

  const getStatusIcon = (part) => {
    if (part.delivered) return <CheckCircle className="w-4 h-4 text-green-600" />;
    if (part.shipped) return <Truck className="w-4 h-4 text-blue-600" />;
    if (part.purchased) return <DollarSign className="w-4 h-4 text-yellow-600" />;
    return <Clock className="w-4 h-4 text-gray-400" />;
  };

  const getStatusText = (part) => {
    if (part.delivered) return 'Delivered';
    if (part.shipped) return 'Shipped';
    if (part.purchased) return 'Purchased';
    return 'Pending';
  };

  const getStatusColor = (part) => {
    if (part.delivered) return 'bg-green-100 text-green-800 border-green-200';
    if (part.shipped) return 'bg-blue-100 text-blue-800 border-blue-200';
    if (part.purchased) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    return 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getTrackingUrl = (tracking) => {
    if (!tracking) return null;
    
    // If it's already a full URL, return it
    if (tracking.startsWith('http')) {
      return tracking;
    }
    
    // Check if it's an Orange Connex tracking number (starts with EX)
    if (tracking.startsWith('EX')) {
      return `https://www.orangeconnex.com/tracking?language=en&trackingnumber=${tracking}`;
    }
    
    // Check if it's an ECMS tracking number (starts with ECSDT)
    if (tracking.startsWith('ECSDT')) {
      return `https://www.ecmsglobal.com/en-us/tracking.html?orderNumber=${tracking}`;
    }
    
    // Check if it's a UPS tracking number
    if (tracking.startsWith('1Z')) {
      return `https://www.ups.com/track?tracknum=${tracking}&loc=en_US&requester=ST/trackdetails`;
    }
    
    // Check if it's a FedEx tracking number (12-14 digits)
    if (/^\d{12,14}$/.test(tracking)) {
      return `https://www.fedex.com/fedextrack/?trknbr=${tracking}`;
    }
    
    // Check if it's a USPS tracking number (20-22 digits or specific patterns)
    if (/^\d{20,22}$/.test(tracking) || /^(94|92|93)\d{20}$/.test(tracking)) {
      return `https://tools.usps.com/go/TrackConfirmAction?tLabels=${tracking}`;
    }
    
    // Check if it's a DHL tracking number (10-11 digits)
    if (/^\d{10,11}$/.test(tracking)) {
      return `https://www.dhl.com/us-en/home/tracking/tracking-express.html?submit=1&tracking-id=${tracking}`;
    }
    
    // For generic text like "Local", "USPS", "FedEx" without tracking number
    return null;
  };

  const getCarrierName = (tracking) => {
    if (!tracking) return null;
    
    // Check if it's an Amazon URL or tracking
    if (tracking.toLowerCase().includes('amazon.com') || tracking.toLowerCase().includes('amzn')) {
      return 'Amazon';
    }
    
    // Check if it's a FedEx URL
    if (tracking.toLowerCase().includes('fedex.com')) {
      return 'FedEx';
    }
    
    // Check if it's an Orange Connex tracking number (starts with EX)
    if (tracking.startsWith('EX')) {
      return 'Orange Connex';
    }
    
    // Check if it's an ECMS tracking number (starts with ECSDT)
    if (tracking.startsWith('ECSDT')) {
      return 'ECMS';
    }
    
    // Check if it's a UPS tracking number
    if (tracking.startsWith('1Z')) {
      return 'UPS';
    }
    
    // Check if it's a FedEx tracking number (12-14 digits)
    if (/^\d{12,14}$/.test(tracking)) {
      return 'FedEx';
    }
    
    // Check if it's a USPS tracking number
    if (/^\d{20,22}$/.test(tracking) || /^(94|92|93)\d{20}$/.test(tracking)) {
      return 'USPS';
    }
    
    // Check if it's a DHL tracking number
    if (/^\d{10,11}$/.test(tracking)) {
      return 'DHL';
    }
    
    // For text like "Local", "USPS", "FedEx", "ECMS" etc.
    const upper = tracking.toUpperCase();
    if (upper.includes('UPS')) return 'UPS';
    if (upper.includes('FEDEX')) return 'FedEx';
    if (upper.includes('USPS')) return 'USPS';
    if (upper.includes('DHL')) return 'DHL';
    if (upper.includes('ECMS')) return 'ECMS';
    if (upper.includes('LOCAL')) return 'Local';
    
    return tracking; // Return as-is if unknown
  };

  const getVendorColor = (vendor) => {
    if (!vendor) return 'bg-gray-100 text-gray-700 border border-gray-200';
    
    const vendorLower = vendor.toLowerCase();
    if (vendorLower === 'toyota') return 'bg-red-100 text-red-700 border border-red-200';
    if (vendorLower === 'ebay') return 'bg-green-100 text-green-700 border border-green-200';
    if (vendorLower === 'etsy') return 'bg-orange-100 text-orange-700 border border-orange-200';
    if (vendorLower === 'partsnext') return 'bg-yellow-100 text-yellow-700 border border-yellow-200';
    if (vendorLower === 'best buy') return 'bg-purple-100 text-purple-700 border border-purple-200';
    if (vendorLower === 'amazon') return 'bg-blue-100 text-blue-700 border border-blue-200';
    if (vendorLower === 'jauce') return 'bg-fuchsia-100 text-fuchsia-700 border border-fuchsia-200';
    
    return 'bg-gray-100 text-gray-700 border border-gray-200';
  };

  const VendorSelect = ({ value, onChange, darkMode }) => {
    return (
      <div className="space-y-2">
        <select
          value={uniqueVendors.includes(value) ? value : ''}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[42px] box-border ${
            darkMode 
              ? 'bg-gray-700 border-gray-600 text-gray-100' 
              : 'bg-white border-gray-300 text-gray-900'
          }`}
          style={{ width: '100%', WebkitAppearance: 'none', appearance: 'none', backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center', backgroundSize: '1.25em 1.25em', paddingRight: '2.5rem' }}
        >
          <option value="">Select a vendor...</option>
          {uniqueVendors.map(vendor => (
            <option key={vendor} value={vendor}>{vendor}</option>
          ))}
        </select>
        
        <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          Or enter a new vendor:
        </div>
        
        <input
          type="text"
          value={!uniqueVendors.includes(value) ? value : ''}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
            darkMode 
              ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400' 
              : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
          }`}
          placeholder="Enter new vendor name"
        />
      </div>
    );
  };

  const StatusDropdown = ({ part }) => {
    const isOpen = openDropdown === part.id;
    
    return (
      <div className="relative">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setOpenDropdown(isOpen ? null : part.id);
          }}
          className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-full border transition-all hover:shadow-md ${getStatusColor(part)}`}
          style={{ width: '8.25rem' }}
        >
          {getStatusIcon(part)}
          <span className="flex-1 text-left">{getStatusText(part)}</span>
          <ChevronDown className={`w-3 h-3 transition-transform flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
        </button>
        
        {isOpen && (
          <>
            <div 
              className="fixed inset-0 z-10" 
              onClick={() => setOpenDropdown(null)}
            />
            <div className="absolute left-0 top-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20 min-w-[140px]">
              <button
                onClick={() => updatePartStatus(part.id, 'delivered')}
                className="w-full px-4 py-2 text-left text-sm hover:bg-green-50 flex items-center gap-2 text-gray-700"
              >
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span>Delivered</span>
              </button>
              <button
                onClick={() => updatePartStatus(part.id, 'shipped')}
                className="w-full px-4 py-2 text-left text-sm hover:bg-blue-50 flex items-center gap-2 text-gray-700"
              >
                <Truck className="w-4 h-4 text-blue-600" />
                <span>Shipped</span>
              </button>
              <button
                onClick={() => updatePartStatus(part.id, 'purchased')}
                className="w-full px-4 py-2 text-left text-sm hover:bg-yellow-50 flex items-center gap-2 text-gray-700"
              >
                <DollarSign className="w-4 h-4 text-yellow-600" />
                <span>Purchased</span>
              </button>
              <button
                onClick={() => updatePartStatus(part.id, 'pending')}
                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 text-gray-700"
              >
                <Clock className="w-4 h-4 text-gray-400" />
                <span>Pending</span>
              </button>
            </div>
          </>
        )}
      </div>
    );
  };

  return (
    <div className={`min-h-screen p-3 sm:p-6 transition-colors duration-200 ${
      darkMode 
        ? 'bg-gradient-to-br from-gray-900 to-gray-800' 
        : 'bg-gradient-to-br from-slate-50 to-slate-100'
    }`}>
      <style>{fontStyles}</style>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className={`text-2xl sm:text-3xl lg:text-4xl font-bold mb-2 ${
                darkMode ? 'text-gray-100' : 'text-slate-800'
              }`} style={{ fontFamily: "'FoundationOne', 'Courier New', monospace" }}>🗻 TAKUMI GARAGE</h1>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setDarkMode(!darkMode)}
                className={`p-2 sm:p-3 rounded-lg shadow-md transition-colors ${
                  darkMode 
                    ? 'bg-gray-700 hover:bg-gray-600 text-yellow-300' 
                    : 'bg-white hover:bg-gray-100 text-gray-700'
                }`}
                title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              >
                {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
              <button
                onClick={() => activeTab === 'parts' ? setShowAddModal(true) : setShowAddProjectModal(true)}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg shadow-md transition-colors font-medium text-sm sm:text-base whitespace-nowrap"
              >
                <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                {activeTab === 'parts' ? 'Add New Part' : 'Add New Project'}
              </button>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className={`mb-6 border-b ${
          darkMode ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <div className="flex gap-1">
            <button
              onClick={() => setActiveTab('parts')}
              className={`flex items-center gap-2 px-6 py-3 font-medium transition-all relative ${
                activeTab === 'parts'
                  ? darkMode
                    ? 'text-blue-400'
                    : 'text-blue-600'
                  : darkMode
                    ? 'text-gray-400 hover:text-gray-300'
                    : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <Package className="w-5 h-5" />
              <span>Parts</span>
              {activeTab === 'parts' && (
                <div className={`absolute bottom-0 left-0 right-0 h-0.5 ${
                  darkMode ? 'bg-blue-400' : 'bg-blue-600'
                }`} />
              )}
            </button>
            <button
              onClick={() => setActiveTab('projects')}
              className={`flex items-center gap-2 px-6 py-3 font-medium transition-all relative ${
                activeTab === 'projects'
                  ? darkMode
                    ? 'text-blue-400'
                    : 'text-blue-600'
                  : darkMode
                    ? 'text-gray-400 hover:text-gray-300'
                    : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <Wrench className="w-5 h-5" />
              <span>Projects</span>
              {activeTab === 'projects' && (
                <div className={`absolute bottom-0 left-0 right-0 h-0.5 ${
                  darkMode ? 'bg-blue-400' : 'bg-blue-600'
                }`} />
              )}
            </button>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
              <p className="text-slate-600">Loading parts from database...</p>
            </div>
          </div>
        )}

        {/* Content - Only show when not loading */}
        {!loading && (
          <>
        {/* Add New Part Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className={`rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto ${
              darkMode ? 'bg-gray-800' : 'bg-white'
            }`}>
              <div className={`sticky top-0 border-b px-6 py-4 flex items-center justify-between ${
                darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
              }`}>
                <h2 className={`text-2xl font-bold ${
                  darkMode ? 'text-gray-100' : 'text-gray-800'
                }`} style={{ fontFamily: "'FoundationOne', 'Courier New', monospace" }}>Add New Part</h2>
                <button
                  onClick={() => setShowAddModal(false)}
                  className={`transition-colors ${
                    darkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className={`block text-sm font-medium mb-2 ${
                      darkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      Part Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={newPart.part}
                      onChange={(e) => setNewPart({ ...newPart, part: e.target.value })}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        darkMode 
                          ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400' 
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                      }`}
                      placeholder="e.g., Front Bumper"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${
                      darkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      Part Number
                    </label>
                    <input
                      type="text"
                      value={newPart.partNumber}
                      onChange={(e) => setNewPart({ ...newPart, partNumber: e.target.value })}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        darkMode 
                          ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400' 
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                      }`}
                      placeholder="e.g., 12345-67890"
                    />
                  </div>
                  
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${
                      darkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      Price ($)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={newPart.price}
                      onChange={(e) => setNewPart({ ...newPart, price: e.target.value })}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                        darkMode 
                          ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400' 
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                      }`}
                      placeholder="0.00"
                    />
                  </div>
                  
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${
                      darkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      Shipping ($)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={newPart.shipping}
                      onChange={(e) => setNewPart({ ...newPart, shipping: e.target.value })}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                        darkMode 
                          ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400' 
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                      }`}
                      placeholder="0.00"
                    />
                  </div>
                  
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${
                      darkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      Import Duties ($)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={newPart.duties}
                      onChange={(e) => setNewPart({ ...newPart, duties: e.target.value })}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                        darkMode 
                          ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400' 
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                      }`}
                      placeholder="0.00"
                    />
                  </div>
                  
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${
                      darkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      Tracking Link
                    </label>
                    <input
                      type="text"
                      value={newPart.tracking}
                      onChange={(e) => setNewPart({ ...newPart, tracking: e.target.value })}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        darkMode 
                          ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400' 
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                      }`}
                      placeholder="e.g., FedEx, USPS"
                    />
                  </div>
                  
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${
                      darkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      Status
                    </label>
                    <select
                      value={newPart.status}
                      onChange={(e) => setNewPart({ ...newPart, status: e.target.value })}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[42px] box-border ${
                        darkMode 
                          ? 'bg-gray-700 border-gray-600 text-gray-100' 
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                      style={{ width: '100%', WebkitAppearance: 'none', appearance: 'none', backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center', backgroundSize: '1.25em 1.25em', paddingRight: '2.5rem' }}
                    >
                      <option value="pending">Pending</option>
                      <option value="purchased">Purchased</option>
                      <option value="shipped">Shipped</option>
                      <option value="delivered">Delivered</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${
                      darkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      Vendor
                    </label>
                    <VendorSelect 
                      value={newPart.vendor}
                      onChange={(value) => setNewPart({ ...newPart, vendor: value })}
                      darkMode={darkMode}
                    />
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-2 ${
                      darkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      Project <span className={`text-xs font-normal ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>(optional)</span>
                    </label>
                    <select
                      value={newPart.projectId || ''}
                      onChange={(e) => setNewPart({ ...newPart, projectId: e.target.value ? parseInt(e.target.value) : null })}
                      className={`w-full h-[42px] px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        darkMode 
                          ? 'bg-gray-700 border-gray-600 text-gray-100' 
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    >
                      <option value="">No Project</option>
                      {projects.map(project => (
                        <option key={project.id} value={project.id}>
                          {project.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  {(newPart.price || newPart.shipping || newPart.duties) && (
                    <div className={`md:col-span-2 border rounded-lg p-4 ${
                      darkMode 
                        ? 'bg-blue-900/30 border-blue-700' 
                        : 'bg-blue-50 border-blue-200'
                    }`}>
                      <div className="flex items-center justify-between">
                        <span className={`text-sm font-medium ${
                          darkMode ? 'text-gray-300' : 'text-gray-700'
                        }`}>Calculated Total:</span>
                        <span className={`text-2xl font-bold ${
                          darkMode ? 'text-blue-400' : 'text-blue-600'
                        }`}>
                          ${((parseFloat(newPart.price) || 0) + (parseFloat(newPart.shipping) || 0) + (parseFloat(newPart.duties) || 0)).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={addNewPart}
                    disabled={!newPart.part}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-medium transition-colors"
                  >
                    Add Part
                  </button>
                  <button
                    onClick={() => setShowAddModal(false)}
                    className={`px-6 py-3 border rounded-lg font-medium transition-colors ${
                      darkMode 
                        ? 'border-gray-600 text-gray-300 hover:bg-gray-700' 
                        : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tracking Info Modal */}
        {showTrackingModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className={`rounded-lg shadow-xl max-w-md w-full ${
              darkMode ? 'bg-gray-800' : 'bg-white'
            }`}>
              <div className={`border-b px-6 py-4 flex items-center justify-between rounded-t-lg ${
                darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
              }`}>
                <h2 className={`text-xl font-bold ${
                  darkMode ? 'text-gray-100' : 'text-gray-800'
                }`} style={{ fontFamily: "'FoundationOne', 'Courier New', monospace" }}>Add Tracking Info</h2>
                <button
                  onClick={() => {
                    setShowTrackingModal(false);
                    setTrackingModalPartId(null);
                    setTrackingInput('');
                  }}
                  className={`transition-colors ${
                    darkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-6">
                <p className={`text-sm mb-4 ${
                  darkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  Enter the tracking number for this shipment (optional)
                </p>
                
                <label className={`block text-sm font-medium mb-2 ${
                  darkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Tracking Number
                </label>
                <input
                  type="text"
                  value={trackingInput}
                  onChange={(e) => setTrackingInput(e.target.value)}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    darkMode 
                      ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400' 
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                  }`}
                  placeholder="e.g., 1Z999AA10123456784"
                  autoFocus
                />
                
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={saveTrackingInfo}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                  >
                    Save
                  </button>
                  <button
                    onClick={skipTrackingInfo}
                    className={`px-4 py-2 border rounded-lg font-medium transition-colors ${
                      darkMode 
                        ? 'border-gray-600 text-gray-300 hover:bg-gray-700' 
                        : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    Skip
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Edit Part Modal */}
        {showEditModal && editingPart && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className={`rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto ${
              darkMode ? 'bg-gray-800' : 'bg-white'
            }`}>
              <div className={`sticky top-0 border-b px-6 py-4 flex items-center justify-between ${
                darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
              }`}>
                <h2 className={`text-2xl font-bold ${
                  darkMode ? 'text-gray-100' : 'text-gray-800'
                }`} style={{ fontFamily: "'FoundationOne', 'Courier New', monospace" }}>Edit Part</h2>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingPart(null);
                  }}
                  className={`transition-colors ${
                    darkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className={`block text-sm font-medium mb-2 ${
                      darkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      Part Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={editingPart.part}
                      onChange={(e) => setEditingPart({ ...editingPart, part: e.target.value })}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        darkMode 
                          ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400' 
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                      }`}
                      placeholder="e.g., Front Bumper"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${
                      darkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      Part Number
                    </label>
                    <input
                      type="text"
                      value={editingPart.partNumber}
                      onChange={(e) => setEditingPart({ ...editingPart, partNumber: e.target.value })}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        darkMode 
                          ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400' 
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                      }`}
                      placeholder="e.g., 12345-67890"
                    />
                  </div>
                  
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${
                      darkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      Price ($)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={editingPart.price}
                      onChange={(e) => setEditingPart({ ...editingPart, price: e.target.value })}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                        darkMode 
                          ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400' 
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                      }`}
                      placeholder="0.00"
                    />
                  </div>
                  
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${
                      darkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      Shipping ($)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={editingPart.shipping}
                      onChange={(e) => setEditingPart({ ...editingPart, shipping: e.target.value })}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                        darkMode 
                          ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400' 
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                      }`}
                      placeholder="0.00"
                    />
                  </div>
                  
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${
                      darkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      Import Duties ($)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={editingPart.duties}
                      onChange={(e) => setEditingPart({ ...editingPart, duties: e.target.value })}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                        darkMode 
                          ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400' 
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                      }`}
                      placeholder="0.00"
                    />
                  </div>
                  
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${
                      darkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      Tracking Number
                    </label>
                    <input
                      type="text"
                      value={editingPart.tracking}
                      onChange={(e) => setEditingPart({ ...editingPart, tracking: e.target.value })}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        darkMode 
                          ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400' 
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                      }`}
                      placeholder="e.g., 1Z999AA10123456784"
                    />
                  </div>
                  
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${
                      darkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      Status
                    </label>
                    <select
                      value={editingPart.status}
                      onChange={(e) => setEditingPart({ ...editingPart, status: e.target.value })}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[42px] box-border ${
                        darkMode 
                          ? 'bg-gray-700 border-gray-600 text-gray-100' 
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                      style={{ width: '100%', WebkitAppearance: 'none', appearance: 'none', backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center', backgroundSize: '1.25em 1.25em', paddingRight: '2.5rem' }}
                    >
                      <option value="pending">Pending</option>
                      <option value="purchased">Purchased</option>
                      <option value="shipped">Shipped</option>
                      <option value="delivered">Delivered</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${
                      darkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      Vendor
                    </label>
                    <VendorSelect 
                      value={editingPart.vendor}
                      onChange={(value) => setEditingPart({ ...editingPart, vendor: value })}
                      darkMode={darkMode}
                    />
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-2 ${
                      darkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      Project <span className={`text-xs font-normal ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>(optional)</span>
                    </label>
                    <select
                      value={editingPart.projectId || ''}
                      onChange={(e) => setEditingPart({ ...editingPart, projectId: e.target.value ? parseInt(e.target.value) : null })}
                      className={`w-full h-[42px] px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        darkMode 
                          ? 'bg-gray-700 border-gray-600 text-gray-100' 
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    >
                      <option value="">No Project</option>
                      {projects.map(project => (
                        <option key={project.id} value={project.id}>
                          {project.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className={`md:col-span-2 border rounded-lg p-4 ${
                    darkMode 
                      ? 'bg-green-900/30 border-green-700' 
                      : 'bg-green-50 border-green-200'
                  }`}>
                    <div className="flex items-center justify-between">
                      <span className={`text-sm font-medium ${
                        darkMode ? 'text-gray-300' : 'text-gray-700'
                      }`}>Calculated Total:</span>
                      <span className={`text-2xl font-bold ${
                        darkMode ? 'text-green-400' : 'text-green-600'
                      }`}>
                        ${((parseFloat(editingPart.price) || 0) + (parseFloat(editingPart.shipping) || 0) + (parseFloat(editingPart.duties) || 0)).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={saveEditedPart}
                    disabled={!editingPart.part}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-medium transition-colors"
                  >
                    Save Changes
                  </button>
                  <button
                    onClick={() => {
                      setShowEditModal(false);
                      setEditingPart(null);
                    }}
                    className={`px-6 py-3 border rounded-lg font-medium transition-colors ${
                      darkMode 
                        ? 'border-gray-600 text-gray-300 hover:bg-gray-700' 
                        : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* PARTS TAB CONTENT */}
        {activeTab === 'parts' && (
          <>
        {/* Statistics and Cost Breakdown - Side by Side */}
        <div className="flex flex-col lg:grid lg:grid-cols-2 gap-6 mb-6">
          {/* Statistics Cards - order-1 on mobile, contains search on desktop */}
          <div className="space-y-4 order-1 lg:order-none">
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <div 
                onClick={() => setStatusFilter(statusFilter === 'purchased' ? 'all' : 'purchased')}
                className={`rounded-lg shadow-md p-3 sm:p-4 lg:p-6 border-l-4 border-yellow-500 relative overflow-hidden cursor-pointer transition-all duration-200 ${
                  darkMode ? 'bg-gray-800 hover:bg-gray-750' : 'bg-white hover:bg-gray-50'
                } ${statusFilter === 'purchased' ? 'ring-2 ring-yellow-500 ring-offset-2' : ''}`}
              >
                <DollarSign className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-500 opacity-20 absolute top-2 sm:top-4 right-2 sm:right-4" />
                <div>
                  <p className={`text-xs sm:text-sm mb-1 sm:mb-2 lg:mb-3 ${
                    darkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}>Order Placed</p>
                  <p className={`text-xl sm:text-2xl lg:text-3xl font-bold truncate ${
                    darkMode ? 'text-gray-100' : 'text-gray-800'
                  }`}>{stats.purchased}</p>
                </div>
              </div>

              <div 
                onClick={() => setStatusFilter(statusFilter === 'shipped' ? 'all' : 'shipped')}
                className={`rounded-lg shadow-md p-3 sm:p-4 lg:p-6 border-l-4 border-blue-500 relative overflow-hidden cursor-pointer transition-all duration-200 ${
                  darkMode ? 'bg-gray-800 hover:bg-gray-750' : 'bg-white hover:bg-gray-50'
                } ${statusFilter === 'shipped' ? 'ring-2 ring-blue-500 ring-offset-2' : ''}`}
              >
                <Truck className="w-6 h-6 sm:w-8 sm:h-8 text-blue-500 opacity-20 absolute top-2 sm:top-4 right-2 sm:right-4" />
                <div>
                  <p className={`text-xs sm:text-sm mb-1 sm:mb-2 lg:mb-3 ${
                    darkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}>In Transit</p>
                  <p className={`text-xl sm:text-2xl lg:text-3xl font-bold truncate ${
                    darkMode ? 'text-gray-100' : 'text-gray-800'
                  }`}>{stats.shipped}</p>
                </div>
              </div>

              <div 
                onClick={() => setStatusFilter(statusFilter === 'delivered' ? 'all' : 'delivered')}
                className={`rounded-lg shadow-md p-3 sm:p-4 lg:p-6 border-l-4 border-green-500 relative overflow-hidden cursor-pointer transition-all duration-200 ${
                  darkMode ? 'bg-gray-800 hover:bg-gray-750' : 'bg-white hover:bg-gray-50'
                } ${statusFilter === 'delivered' ? 'ring-2 ring-green-500 ring-offset-2' : ''}`}
              >
                <CheckCircle className="w-6 h-6 sm:w-8 sm:h-8 text-green-500 opacity-20 absolute top-2 sm:top-4 right-2 sm:right-4" />
                <div>
                  <p className={`text-xs sm:text-sm mb-1 sm:mb-2 lg:mb-3 ${
                    darkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}>Delivered</p>
                  <p className={`text-xl sm:text-2xl lg:text-3xl font-bold truncate ${
                    darkMode ? 'text-gray-100' : 'text-gray-800'
                  }`}>{stats.delivered}</p>
                </div>
              </div>

              <div className={`rounded-lg shadow-md p-3 sm:p-4 lg:p-6 border-l-4 border-purple-500 relative overflow-hidden ${
                darkMode ? 'bg-gray-800' : 'bg-white'
              }`}>
                <DollarSign className="w-6 h-6 sm:w-8 sm:h-8 text-purple-500 opacity-20 absolute top-2 sm:top-4 right-2 sm:right-4" />
                <div>
                  <p className={`text-xs sm:text-sm mb-1 sm:mb-2 lg:mb-3 ${
                    darkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}>Total Spent</p>
                  <p className={`text-lg sm:text-2xl lg:text-3xl font-bold truncate ${
                    darkMode ? 'text-gray-100' : 'text-gray-800'
                  }`}>${stats.totalCost.toFixed(2)}</p>
                </div>
              </div>
            </div>

            {/* Search Box - Shows in left column on desktop only */}
            <div className={`hidden lg:block rounded-lg shadow-md p-3 ${
              darkMode ? 'bg-gray-800' : 'bg-white'
            }`}>
              <div className="relative">
                <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${
                  darkMode ? 'text-gray-500' : 'text-gray-400'
                }`} />
                <input
                  type="text"
                  placeholder="Search parts..."
                  className={`w-full pl-10 pr-10 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    darkMode 
                      ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400' 
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                  }`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className={`absolute right-3 top-1/2 transform -translate-y-1/2 transition-colors ${
                      darkMode ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'
                    }`}
                    title="Clear search"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Cost Breakdown - order-2 on mobile */}
          <div className={`rounded-lg shadow-md p-4 sm:p-6 order-2 lg:order-none ${
            darkMode ? 'bg-gray-800' : 'bg-white'
          }`}>
            <h3 className={`text-base sm:text-lg font-semibold mb-4 flex items-center gap-2 ${
              darkMode ? 'text-gray-100' : 'text-gray-800'
            }`}>
              <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5" />
              Cost Breakdown
            </h3>
            <div className="grid grid-cols-1 gap-4">
              <div className={`flex items-center justify-between py-2 border-b ${
                darkMode ? 'border-gray-700' : 'border-gray-100'
              }`}>
                <p className={`text-xs sm:text-sm ${
                  darkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>Parts Cost</p>
                <p className={`text-base sm:text-xl font-semibold truncate ${
                  darkMode ? 'text-gray-100' : 'text-gray-800'
                }`}>${stats.totalPrice.toFixed(2)}</p>
              </div>
              <div className={`flex items-center justify-between py-2 border-b ${
                darkMode ? 'border-gray-700' : 'border-gray-100'
              }`}>
                <p className={`text-xs sm:text-sm ${
                  darkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>Shipping</p>
                <p className={`text-base sm:text-xl font-semibold truncate ${
                  darkMode ? 'text-gray-100' : 'text-gray-800'
                }`}>${stats.totalShipping.toFixed(2)}</p>
              </div>
              <div className={`flex items-center justify-between py-2 border-b ${
                darkMode ? 'border-gray-700' : 'border-gray-100'
              }`}>
                <p className={`text-xs sm:text-sm ${
                  darkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>Import Duties</p>
                <p className={`text-base sm:text-xl font-semibold truncate ${
                  darkMode ? 'text-gray-100' : 'text-gray-800'
                }`}>${stats.totalDuties.toFixed(2)}</p>
              </div>
              <div className="pt-2">
                <p className={`text-sm mb-2 ${
                  darkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>Progress</p>
                <div className="flex items-center gap-2">
                  <div className={`flex-1 rounded-full h-2 ${
                    darkMode ? 'bg-gray-700' : 'bg-gray-200'
                  }`}>
                    <div 
                      className="bg-green-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${(stats.delivered / stats.total) * 100}%` }}
                    />
                  </div>
                  <span className={`text-sm font-semibold ${
                    darkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    {Math.round((stats.delivered / stats.total) * 100)}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Search Box - Mobile only (order-3, shows after cost breakdown) */}
          <div className={`lg:hidden rounded-lg shadow-md p-3 order-3 ${
            darkMode ? 'bg-gray-800' : 'bg-white'
          }`}>
            <div className="relative">
              <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${
                darkMode ? 'text-gray-500' : 'text-gray-400'
              }`} />
              <input
                type="text"
                placeholder="Search parts..."
                className={`w-full pl-10 pr-10 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  darkMode 
                    ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400' 
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                }`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className={`absolute right-3 top-1/2 transform -translate-y-1/2 transition-colors ${
                    darkMode ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'
                  }`}
                  title="Clear search"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Parts Table */}
        <div className={`rounded-lg shadow-md overflow-hidden ${
          darkMode ? 'bg-gray-800' : 'bg-white'
        }`}>
          {/* Desktop Table View - Hidden on mobile */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead className={`border-b ${
                darkMode ? 'bg-gray-700 border-gray-600' : 'bg-slate-100 border-slate-200'
              }`}>
                <tr>
                  <th 
                    onClick={() => handleSort('status')}
                    className={`px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider cursor-pointer transition-colors ${
                      darkMode ? 'text-gray-300 hover:bg-gray-600' : 'text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      Status
                      {getSortIcon('status')}
                    </div>
                  </th>
                  <th className={`px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider ${
                    darkMode ? 'text-gray-300' : 'text-slate-700'
                  }`}>Part</th>
                  <th className={`hidden px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider ${
                    darkMode ? 'text-gray-300' : 'text-slate-700'
                  }`}>Part #</th>
                  <th 
                    onClick={() => handleSort('vendor')}
                    className={`px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider cursor-pointer transition-colors ${
                      darkMode ? 'text-gray-300 hover:bg-gray-600' : 'text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      Vendor
                      {getSortIcon('vendor')}
                    </div>
                  </th>
                  <th className={`px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider ${
                    darkMode ? 'text-gray-300' : 'text-slate-700'
                  }`}>Project</th>
                  <th 
                    onClick={() => handleSort('price')}
                    className={`px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider cursor-pointer transition-colors ${
                      darkMode ? 'text-gray-300 hover:bg-gray-600' : 'text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-end gap-2">
                      Price
                      {getSortIcon('price')}
                    </div>
                  </th>
                  <th className={`px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider ${
                    darkMode ? 'text-gray-300' : 'text-slate-700'
                  }`}>Shipping</th>
                  <th className={`px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider ${
                    darkMode ? 'text-gray-300' : 'text-slate-700'
                  }`}>Duties</th>
                  <th 
                    onClick={() => handleSort('total')}
                    className={`px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider cursor-pointer transition-colors ${
                      darkMode ? 'text-gray-300 hover:bg-gray-600' : 'text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-end gap-2">
                      Total
                      {getSortIcon('total')}
                    </div>
                  </th>
                  <th className={`px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider ${
                    darkMode ? 'text-gray-300' : 'text-slate-700'
                  }`}>Tracking</th>
                  <th className={`px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider ${
                    darkMode ? 'text-gray-300' : 'text-slate-700'
                  }`}>Actions</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${
                darkMode ? 'divide-gray-700' : 'divide-slate-200'
              }`}>
                {filteredParts.map((part) => (
                  <tr key={part.id} className={`transition-colors ${
                    darkMode ? 'hover:bg-gray-700' : 'hover:bg-slate-50'
                  }`}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusDropdown part={part} />
                    </td>
                    <td className="px-6 py-4">
                      <div className={`text-sm font-medium ${
                        darkMode ? 'text-gray-100' : 'text-slate-900'
                      }`}>{part.part}</div>
                    </td>
                    <td className="hidden px-6 py-4">
                      {part.partNumber && part.partNumber !== '-' ? (
                        <div className={`text-sm font-mono ${
                          darkMode ? 'text-gray-300' : 'text-slate-600'
                        }`}>{part.partNumber}</div>
                      ) : (
                        <div className={`text-sm text-center ${
                          darkMode ? 'text-gray-600' : 'text-slate-400'
                        }`}>—</div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {part.vendor ? (
                        <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium text-center ${getVendorColor(part.vendor)}`}>
                          {part.vendor}
                        </span>
                      ) : (
                        <div className={`text-sm text-center ${
                          darkMode ? 'text-gray-600' : 'text-slate-400'
                        }`}>—</div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {part.projectId ? (
                        <span className={`inline-block px-3 py-1 rounded text-xs font-medium ${
                          darkMode ? 'bg-blue-900/50 text-blue-200' : 'bg-blue-100 text-blue-800'
                        }`}>
                          {projects.find(p => p.id === part.projectId)?.name || 'Unknown'}
                        </span>
                      ) : (
                        <div className={`text-sm text-center ${
                          darkMode ? 'text-gray-600' : 'text-slate-400'
                        }`}>—</div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className={`text-sm ${
                        darkMode ? 'text-gray-100' : 'text-slate-900'
                      }`}>${part.price.toFixed(2)}</div>
                    </td>
                    <td className="px-6 py-4">
                      {part.shipping > 0 ? (
                        <div className={`text-sm text-right ${
                          darkMode ? 'text-gray-300' : 'text-slate-600'
                        }`}>${part.shipping.toFixed(2)}</div>
                      ) : (
                        <div className={`text-sm text-center ${
                          darkMode ? 'text-gray-600' : 'text-slate-400'
                        }`}>—</div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {part.duties > 0 ? (
                        <div className={`text-sm text-right ${
                          darkMode ? 'text-gray-300' : 'text-slate-600'
                        }`}>${part.duties.toFixed(2)}</div>
                      ) : (
                        <div className={`text-sm text-center ${
                          darkMode ? 'text-gray-600' : 'text-slate-400'
                        }`}>—</div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className={`text-sm font-semibold ${
                        darkMode ? 'text-gray-100' : 'text-slate-900'
                      }`}>${part.total.toFixed(2)}</div>
                    </td>
                    <td className="px-6 py-4">
                      {part.tracking ? (
                        getTrackingUrl(part.tracking) ? (
                          <a
                            href={getTrackingUrl(part.tracking)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-blue-400 hover:bg-blue-500 text-white text-sm font-medium rounded-md transition-colors w-28"
                          >
                            {getCarrierName(part.tracking)}
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        ) : (
                          <div className={`inline-flex items-center justify-center px-3 py-1.5 text-sm font-medium rounded-md w-28 ${
                            darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'
                          }`}>
                            {getCarrierName(part.tracking)}
                          </div>
                        )
                      ) : (
                        <div className={`text-sm text-center ${
                          darkMode ? 'text-gray-600' : 'text-slate-400'
                        }`}>—</div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => openEditModal(part)}
                          className={`inline-flex items-center justify-center p-2 border rounded-md transition-colors ${
                            darkMode 
                              ? 'text-gray-400 hover:text-blue-400 hover:bg-gray-700 border-gray-600 hover:border-blue-500' 
                              : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50 border-gray-300 hover:border-blue-300'
                          }`}
                          title="Edit part"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deletePart(part.id)}
                          className={`inline-flex items-center justify-center p-2 border rounded-md transition-colors ${
                            darkMode 
                              ? 'text-gray-400 hover:text-red-400 hover:bg-gray-700 border-gray-600 hover:border-red-500' 
                              : 'text-gray-600 hover:text-red-600 hover:bg-red-50 border-gray-300 hover:border-red-300'
                          }`}
                          title="Delete part"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View - Visible only on mobile */}
          <div className="md:hidden space-y-4 p-4">
            {filteredParts.map((part) => (
              <div 
                key={part.id}
                className={`rounded-lg border shadow-sm overflow-hidden ${
                  darkMode 
                    ? 'bg-gray-700 border-gray-600' 
                    : 'bg-white border-slate-200'
                }`}
              >
                {/* Card Header with Status and Actions */}
                <div className={`flex items-center justify-between p-4 border-b ${
                  darkMode ? 'border-gray-600' : 'border-slate-200'
                }`}>
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="flex-shrink-0">
                      {part.delivered ? (
                        <CheckCircle className="w-6 h-6 text-green-600" />
                      ) : part.shipped ? (
                        <Truck className="w-6 h-6 text-blue-600" />
                      ) : part.purchased ? (
                        <DollarSign className="w-6 h-6 text-yellow-600" />
                      ) : (
                        <Clock className="w-6 h-6 text-gray-400" />
                      )}
                    </div>
                    <div className={`font-semibold text-sm truncate ${
                      darkMode ? 'text-gray-100' : 'text-slate-900'
                    }`}>
                      {part.part}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                    <button
                      onClick={() => openEditModal(part)}
                      className={`p-2 border rounded-md transition-colors ${
                        darkMode 
                          ? 'text-gray-400 hover:text-blue-400 hover:bg-gray-600 border-gray-600' 
                          : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50 border-gray-300'
                      }`}
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deletePart(part.id)}
                      className={`p-2 border rounded-md transition-colors ${
                        darkMode 
                          ? 'text-gray-400 hover:text-red-400 hover:bg-gray-600 border-gray-600' 
                          : 'text-gray-600 hover:text-red-600 hover:bg-red-50 border-gray-300'
                      }`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Card Body with Details */}
                <div className="p-4 space-y-3">
                  {/* Part Number */}
                  {part.partNumber && part.partNumber !== '-' && (
                    <div className="flex justify-between items-center gap-2">
                      <span className={`text-sm font-medium flex-shrink-0 ${
                        darkMode ? 'text-gray-400' : 'text-slate-600'
                      }`}>Part Number</span>
                      <span className={`text-sm font-mono text-right ${
                        darkMode ? 'text-gray-300' : 'text-slate-900'
                      }`}>{part.partNumber}</span>
                    </div>
                  )}

                  {/* Vendor */}
                  {part.vendor && (
                    <div className="flex justify-between items-center gap-2">
                      <span className={`text-sm font-medium flex-shrink-0 ${
                        darkMode ? 'text-gray-400' : 'text-slate-600'
                      }`}>Vendor</span>
                      <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getVendorColor(part.vendor)}`}>
                        {part.vendor}
                      </span>
                    </div>
                  )}

                  {/* Project */}
                  {part.projectId && (
                    <div className="flex justify-between items-center gap-2">
                      <span className={`text-sm font-medium flex-shrink-0 ${
                        darkMode ? 'text-gray-400' : 'text-slate-600'
                      }`}>Project</span>
                      <span className={`inline-block px-3 py-1 rounded text-xs font-medium ${
                        darkMode ? 'bg-blue-900/50 text-blue-200' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {projects.find(p => p.id === part.projectId)?.name || 'Unknown'}
                      </span>
                    </div>
                  )}

                  {/* Price Breakdown */}
                  <div className={`pt-3 border-t ${
                    darkMode ? 'border-gray-600' : 'border-slate-200'
                  }`}>
                    <div className="flex justify-between items-center mb-2">
                      <span className={`text-sm ${
                        darkMode ? 'text-gray-400' : 'text-slate-600'
                      }`}>Price</span>
                      <span className={`text-sm font-medium ${
                        darkMode ? 'text-gray-100' : 'text-slate-900'
                      }`}>${part.price.toFixed(2)}</span>
                    </div>
                    {part.shipping > 0 && (
                      <div className="flex justify-between items-center mb-2">
                        <span className={`text-sm ${
                          darkMode ? 'text-gray-400' : 'text-slate-600'
                        }`}>Shipping</span>
                        <span className={`text-sm ${
                          darkMode ? 'text-gray-300' : 'text-slate-600'
                        }`}>${part.shipping.toFixed(2)}</span>
                      </div>
                    )}
                    {part.duties > 0 && (
                      <div className="flex justify-between items-center mb-2">
                        <span className={`text-sm ${
                          darkMode ? 'text-gray-400' : 'text-slate-600'
                        }`}>Duties</span>
                        <span className={`text-sm ${
                          darkMode ? 'text-gray-300' : 'text-slate-600'
                        }`}>${part.duties.toFixed(2)}</span>
                      </div>
                    )}
                    <div className={`flex justify-between items-center pt-2 border-t ${
                      darkMode ? 'border-gray-600 border-dashed' : 'border-slate-200 border-dashed'
                    }`}>
                      <span className={`text-sm font-semibold ${
                        darkMode ? 'text-gray-300' : 'text-slate-700'
                      }`}>Total</span>
                      <span className={`text-base font-bold ${
                        darkMode ? 'text-gray-100' : 'text-slate-900'
                      }`}>${part.total.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Tracking */}
                  {part.tracking && (
                    <div className={`pt-3 border-t ${
                      darkMode ? 'border-gray-600' : 'border-slate-200'
                    }`}>
                      <div className="flex justify-between items-center gap-2">
                        <span className={`text-sm font-medium flex-shrink-0 ${
                          darkMode ? 'text-gray-400' : 'text-slate-600'
                        }`}>Tracking</span>
                        {getTrackingUrl(part.tracking) ? (
                          <a
                            href={getTrackingUrl(part.tracking)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-400 hover:bg-blue-500 text-white text-sm font-medium rounded-md transition-colors"
                          >
                            {getCarrierName(part.tracking)}
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        ) : (
                          <div className={`inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-md ${
                            darkMode ? 'bg-gray-600 text-gray-300' : 'bg-gray-200 text-gray-700'
                          }`}>
                            {getCarrierName(part.tracking)}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
          
          
          <div className={`px-6 py-4 border-t ${
            darkMode ? 'bg-gray-700 border-gray-600' : 'bg-slate-50 border-slate-200'
          }`}>
            <p className={`text-sm ${
              darkMode ? 'text-gray-400' : 'text-slate-600'
            }`}>
              Showing <span className="font-semibold">{filteredParts.length}</span> of <span className="font-semibold">{stats.total}</span> parts
            </p>
          </div>
        </div>
        </>
        )}

        {/* PROJECTS TAB CONTENT */}
        {activeTab === 'projects' && (
          <>
            {/* Projects Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((project) => {
                // Calculate spent based on linked parts
                const linkedPartsTotal = parts
                  .filter(part => part.projectId === project.id)
                  .reduce((sum, part) => sum + (part.total || 0), 0);
                const progress = project.budget > 0 ? (linkedPartsTotal / project.budget) * 100 : 0;
                const statusColors = {
                  planning: darkMode ? 'bg-gray-600 text-gray-200' : 'bg-gray-200 text-gray-800',
                  in_progress: darkMode ? 'bg-blue-600 text-blue-100' : 'bg-blue-100 text-blue-800',
                  completed: darkMode ? 'bg-green-600 text-green-100' : 'bg-green-100 text-green-800',
                  on_hold: darkMode ? 'bg-yellow-600 text-yellow-100' : 'bg-yellow-100 text-yellow-800'
                };
                const priorityColors = {
                  low: darkMode ? 'text-green-400' : 'text-green-600',
                  medium: darkMode ? 'text-yellow-400' : 'text-yellow-600',
                  high: darkMode ? 'text-red-400' : 'text-red-600'
                };

                return (
                  <div
                    key={project.id}
                    onClick={() => {
                      setViewingProject(project);
                      setShowProjectDetailModal(true);
                    }}
                    className={`rounded-lg shadow-lg p-6 transition-all hover:shadow-xl cursor-pointer ${
                      darkMode ? 'bg-gray-800' : 'bg-white'
                    }`}
                  >
                    {/* Project Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className={`text-xl font-bold mb-2 ${
                          darkMode ? 'text-gray-100' : 'text-gray-900'
                        }`}>
                          {project.name}
                        </h3>
                        <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                          statusColors[project.status]
                        }`}>
                          {project.status.replace('_', ' ').toUpperCase()}
                        </span>
                      </div>
                      <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => {
                            setEditingProject(project);
                            setShowEditProjectModal(true);
                          }}
                          className={`p-2 rounded-lg transition-colors ${
                            darkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-600'
                          }`}
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteProject(project.id)}
                          className={`p-2 rounded-lg transition-colors ${
                            darkMode ? 'hover:bg-gray-700 text-red-400' : 'hover:bg-gray-100 text-red-600'
                          }`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Description */}
                    {project.description && (
                      <p className={`text-sm mb-4 ${
                        darkMode ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        {project.description}
                      </p>
                    )}

                    {/* Progress Bar */}
                    <div className="mb-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className={`text-sm font-medium ${
                          darkMode ? 'text-gray-300' : 'text-gray-700'
                        }`}>
                          Budget Used
                        </span>
                        <span className={`text-sm font-bold ${
                          darkMode ? 'text-gray-200' : 'text-gray-900'
                        }`}>
                          {progress.toFixed(0)}%
                        </span>
                      </div>
                      <div className={`w-full rounded-full h-3 ${
                        darkMode ? 'bg-gray-700' : 'bg-gray-200'
                      }`}>
                        <div
                          className={`h-3 rounded-full transition-all ${
                            progress > 90
                              ? 'bg-red-500'
                              : progress > 70
                              ? 'bg-yellow-500'
                              : 'bg-green-500'
                          }`}
                          style={{ width: `${Math.min(progress, 100)}%` }}
                        />
                      </div>
                    </div>

                    {/* Budget Info */}
                    <div className={`grid grid-cols-2 gap-4 mb-4 p-3 rounded-lg ${
                      darkMode ? 'bg-gray-700' : 'bg-gray-50'
                    }`}>
                      <div>
                        <p className={`text-xs mb-1 ${
                          darkMode ? 'text-gray-400' : 'text-gray-600'
                        }`}>
                          Spent
                        </p>
                        <p className={`text-lg font-bold ${
                          darkMode ? 'text-gray-100' : 'text-gray-900'
                        }`}>
                          ${linkedPartsTotal.toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <p className={`text-xs mb-1 ${
                          darkMode ? 'text-gray-400' : 'text-gray-600'
                        }`}>
                          Budget
                        </p>
                        <p className={`text-lg font-bold ${
                          darkMode ? 'text-gray-100' : 'text-gray-900'
                        }`}>
                          ${project.budget?.toFixed(2) || '0.00'}
                        </p>
                      </div>
                    </div>

                    {/* Dates and Priority */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Calendar className={`w-4 h-4 ${
                          darkMode ? 'text-gray-400' : 'text-gray-600'
                        }`} />
                        <span className={`text-sm ${
                          darkMode ? 'text-gray-300' : 'text-gray-700'
                        }`}>
                          Started: {project.start_date ? new Date(project.start_date).toLocaleDateString() : 'TBD'}
                        </span>
                      </div>
                      {project.target_date && (
                        <div className="flex items-center gap-2">
                          <Target className={`w-4 h-4 ${
                            darkMode ? 'text-gray-400' : 'text-gray-600'
                          }`} />
                          <span className={`text-sm ${
                            darkMode ? 'text-gray-300' : 'text-gray-700'
                          }`}>
                            Target: {new Date(project.target_date).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-medium ${
                          darkMode ? 'text-gray-400' : 'text-gray-600'
                        }`}>
                          Priority:
                        </span>
                        <span className={`text-sm font-bold ${priorityColors[project.priority]}`}>
                          {project.priority?.toUpperCase()}
                        </span>
                      </div>
                    </div>

                    {/* Linked Parts */}
                    {(() => {
                      const linkedParts = parts.filter(part => part.projectId === project.id);
                      if (linkedParts.length > 0) {
                        return (
                          <div className={`mt-4 pt-4 border-t ${
                            darkMode ? 'border-gray-600' : 'border-gray-200'
                          }`}>
                            <div className="flex items-center justify-between mb-2">
                              <span className={`text-sm font-semibold ${
                                darkMode ? 'text-gray-300' : 'text-gray-700'
                              }`}>
                                Linked Parts ({linkedParts.length})
                              </span>
                            </div>
                            <div className="space-y-1">
                              {linkedParts.slice(0, 3).map((part) => (
                                <div 
                                  key={part.id}
                                  className={`text-xs px-2 py-1 rounded ${
                                    darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'
                                  }`}
                                >
                                  <div className="flex justify-between items-center">
                                    <span className="truncate flex-1">{part.part}</span>
                                    <span className="ml-2 font-medium">${part.total.toFixed(2)}</span>
                                  </div>
                                </div>
                              ))}
                              {linkedParts.length > 3 && (
                                <div className={`text-xs text-center py-1 ${
                                  darkMode ? 'text-gray-400' : 'text-gray-600'
                                }`}>
                                  +{linkedParts.length - 3} more
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      }
                      return null;
                    })()}
                  </div>
                );
              })}
            </div>

            {/* Empty State */}
            {projects.length === 0 && (
              <div className={`text-center py-12 rounded-lg ${
                darkMode ? 'bg-gray-800' : 'bg-white'
              }`}>
                <Wrench className={`w-16 h-16 mx-auto mb-4 ${
                  darkMode ? 'text-gray-600' : 'text-gray-400'
                }`} />
                <h3 className={`text-xl font-semibold mb-2 ${
                  darkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  No Projects Yet
                </h3>
                <p className={`mb-4 ${
                  darkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  Start organizing your restoration by creating your first project
                </p>
                <button
                  onClick={() => setShowAddProjectModal(true)}
                  className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg shadow-md transition-colors font-medium"
                >
                  <Plus className="w-5 h-5" />
                  Create First Project
                </button>
              </div>
            )}

            {/* Add Project Modal */}
            {showAddProjectModal && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className={`rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto ${
                  darkMode ? 'bg-gray-800' : 'bg-white'
                }`}>
                  <div className={`sticky top-0 border-b px-6 py-4 flex items-center justify-between ${
                    darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                  }`}>
                    <h2 className={`text-2xl font-bold ${
                      darkMode ? 'text-gray-100' : 'text-gray-800'
                    }`} style={{ fontFamily: "'FoundationOne', 'Courier New', monospace" }}>
                      Add New Project
                    </h2>
                    <button
                      onClick={() => setShowAddProjectModal(false)}
                      className={`transition-colors ${
                        darkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'
                      }`}
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>

                  <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="md:col-span-2">
                        <label className={`block text-sm font-medium mb-2 ${
                          darkMode ? 'text-gray-300' : 'text-gray-700'
                        }`}>
                          Project Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={newProject.name}
                          onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                            darkMode 
                              ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400' 
                              : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                          }`}
                          placeholder="e.g., Interior Restoration"
                          required
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className={`block text-sm font-medium mb-2 ${
                          darkMode ? 'text-gray-300' : 'text-gray-700'
                        }`}>
                          Description
                        </label>
                        <textarea
                          value={newProject.description}
                          onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                            darkMode 
                              ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400' 
                              : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                          }`}
                          placeholder="Brief description of the project"
                          rows="3"
                        />
                      </div>

                      <div>
                        <label className={`block text-sm font-medium mb-2 ${
                          darkMode ? 'text-gray-300' : 'text-gray-700'
                        }`}>
                          Budget ($)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={newProject.budget}
                          onChange={(e) => setNewProject({ ...newProject, budget: e.target.value })}
                          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                            darkMode 
                              ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400' 
                              : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                          }`}
                          placeholder="0.00"
                        />
                      </div>

                      <div>
                        <label className={`block text-sm font-medium mb-2 ${
                          darkMode ? 'text-gray-300' : 'text-gray-700'
                        }`}>
                          Priority
                        </label>
                        <select
                          value={newProject.priority}
                          onChange={(e) => setNewProject({ ...newProject, priority: e.target.value })}
                          className={`w-full h-[42px] px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                            darkMode 
                              ? 'bg-gray-700 border-gray-600 text-gray-100' 
                              : 'bg-white border-gray-300 text-gray-900'
                          }`}
                        >
                          <option value="low">Low</option>
                          <option value="medium">Medium</option>
                          <option value="high">High</option>
                        </select>
                      </div>

                      <div>
                        <label className={`block text-sm font-medium mb-2 ${
                          darkMode ? 'text-gray-300' : 'text-gray-700'
                        }`}>
                          Start Date
                        </label>
                        <input
                          type="date"
                          value={newProject.start_date}
                          onChange={(e) => setNewProject({ ...newProject, start_date: e.target.value })}
                          className={`w-full h-[42px] px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                            darkMode 
                              ? 'bg-gray-700 border-gray-600 text-gray-100' 
                              : 'bg-white border-gray-300 text-gray-900'
                          }`}
                        />
                      </div>

                      <div>
                        <label className={`block text-sm font-medium mb-2 ${
                          darkMode ? 'text-gray-300' : 'text-gray-700'
                        }`}>
                          Target Date
                        </label>
                        <input
                          type="date"
                          value={newProject.target_date}
                          onChange={(e) => setNewProject({ ...newProject, target_date: e.target.value })}
                          className={`w-full h-[42px] px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                            darkMode 
                              ? 'bg-gray-700 border-gray-600 text-gray-100' 
                              : 'bg-white border-gray-300 text-gray-900'
                          }`}
                        />
                      </div>

                      <div>
                        <label className={`block text-sm font-medium mb-2 ${
                          darkMode ? 'text-gray-300' : 'text-gray-700'
                        }`}>
                          Status
                        </label>
                        <select
                          value={newProject.status}
                          onChange={(e) => setNewProject({ ...newProject, status: e.target.value })}
                          className={`w-full h-[42px] px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                            darkMode 
                              ? 'bg-gray-700 border-gray-600 text-gray-100' 
                              : 'bg-white border-gray-300 text-gray-900'
                          }`}
                        >
                          <option value="planning">Planning</option>
                          <option value="in_progress">In Progress</option>
                          <option value="on_hold">On Hold</option>
                          <option value="completed">Completed</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex gap-3 mt-6">
                      <button
                        onClick={() => setShowAddProjectModal(false)}
                        className={`flex-1 px-6 py-3 rounded-lg font-medium transition-colors ${
                          darkMode 
                            ? 'bg-gray-700 hover:bg-gray-600 text-gray-100' 
                            : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
                        }`}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={async () => {
                          if (!newProject.name) {
                            alert('Please enter a project name');
                            return;
                          }
                          await addProject(newProject);
                          setNewProject({
                            name: '',
                            description: '',
                            budget: '',
                            start_date: '',
                            target_date: '',
                            priority: 'medium',
                            status: 'planning'
                          });
                          setShowAddProjectModal(false);
                        }}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                      >
                        Add Project
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Edit Project Modal */}
            {showEditProjectModal && editingProject && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className={`rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto ${
                  darkMode ? 'bg-gray-800' : 'bg-white'
                }`}>
                  <div className={`sticky top-0 border-b px-6 py-4 flex items-center justify-between ${
                    darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                  }`}>
                    <h2 className={`text-2xl font-bold ${
                      darkMode ? 'text-gray-100' : 'text-gray-800'
                    }`} style={{ fontFamily: "'FoundationOne', 'Courier New', monospace" }}>
                      Edit Project
                    </h2>
                    <button
                      onClick={() => {
                        setShowEditProjectModal(false);
                        setEditingProject(null);
                      }}
                      className={`transition-colors ${
                        darkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'
                      }`}
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>

                  <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="md:col-span-2">
                        <label className={`block text-sm font-medium mb-2 ${
                          darkMode ? 'text-gray-300' : 'text-gray-700'
                        }`}>
                          Project Name
                        </label>
                        <input
                          type="text"
                          value={editingProject.name}
                          onChange={(e) => setEditingProject({ ...editingProject, name: e.target.value })}
                          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                            darkMode 
                              ? 'bg-gray-700 border-gray-600 text-gray-100' 
                              : 'bg-white border-gray-300 text-gray-900'
                          }`}
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className={`block text-sm font-medium mb-2 ${
                          darkMode ? 'text-gray-300' : 'text-gray-700'
                        }`}>
                          Description
                        </label>
                        <textarea
                          value={editingProject.description}
                          onChange={(e) => setEditingProject({ ...editingProject, description: e.target.value })}
                          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                            darkMode 
                              ? 'bg-gray-700 border-gray-600 text-gray-100' 
                              : 'bg-white border-gray-300 text-gray-900'
                          }`}
                          rows="3"
                        />
                      </div>

                      <div>
                        <label className={`block text-sm font-medium mb-2 ${
                          darkMode ? 'text-gray-300' : 'text-gray-700'
                        }`}>
                          Budget ($)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={editingProject.budget}
                          onChange={(e) => setEditingProject({ ...editingProject, budget: e.target.value })}
                          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                            darkMode 
                              ? 'bg-gray-700 border-gray-600 text-gray-100' 
                              : 'bg-white border-gray-300 text-gray-900'
                          }`}
                        />
                      </div>

                      <div>
                        <label className={`block text-sm font-medium mb-2 ${
                          darkMode ? 'text-gray-300' : 'text-gray-700'
                        }`}>
                          Spent ($)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={editingProject.spent}
                          onChange={(e) => setEditingProject({ ...editingProject, spent: e.target.value })}
                          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                            darkMode 
                              ? 'bg-gray-700 border-gray-600 text-gray-100' 
                              : 'bg-white border-gray-300 text-gray-900'
                          }`}
                        />
                      </div>

                      <div>
                        <label className={`block text-sm font-medium mb-2 ${
                          darkMode ? 'text-gray-300' : 'text-gray-700'
                        }`}>
                          Priority
                        </label>
                        <select
                          value={editingProject.priority}
                          onChange={(e) => setEditingProject({ ...editingProject, priority: e.target.value })}
                          className={`w-full h-[42px] px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                            darkMode 
                              ? 'bg-gray-700 border-gray-600 text-gray-100' 
                              : 'bg-white border-gray-300 text-gray-900'
                          }`}
                        >
                          <option value="low">Low</option>
                          <option value="medium">Medium</option>
                          <option value="high">High</option>
                        </select>
                      </div>

                      <div>
                        <label className={`block text-sm font-medium mb-2 ${
                          darkMode ? 'text-gray-300' : 'text-gray-700'
                        }`}>
                          Start Date
                        </label>
                        <input
                          type="date"
                          value={editingProject.start_date || ''}
                          onChange={(e) => setEditingProject({ ...editingProject, start_date: e.target.value })}
                          className={`w-full h-[42px] px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                            darkMode 
                              ? 'bg-gray-700 border-gray-600 text-gray-100' 
                              : 'bg-white border-gray-300 text-gray-900'
                          }`}
                        />
                      </div>

                      <div>
                        <label className={`block text-sm font-medium mb-2 ${
                          darkMode ? 'text-gray-300' : 'text-gray-700'
                        }`}>
                          Target Date
                        </label>
                        <input
                          type="date"
                          value={editingProject.target_date || ''}
                          onChange={(e) => setEditingProject({ ...editingProject, target_date: e.target.value })}
                          className={`w-full h-[42px] px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                            darkMode 
                              ? 'bg-gray-700 border-gray-600 text-gray-100' 
                              : 'bg-white border-gray-300 text-gray-900'
                          }`}
                        />
                      </div>

                      <div>
                        <label className={`block text-sm font-medium mb-2 ${
                          darkMode ? 'text-gray-300' : 'text-gray-700'
                        }`}>
                          Status
                        </label>
                        <select
                          value={editingProject.status}
                          onChange={(e) => setEditingProject({ ...editingProject, status: e.target.value })}
                          className={`w-full h-[42px] px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                            darkMode 
                              ? 'bg-gray-700 border-gray-600 text-gray-100' 
                              : 'bg-white border-gray-300 text-gray-900'
                          }`}
                        >
                          <option value="planning">Planning</option>
                          <option value="in_progress">In Progress</option>
                          <option value="on_hold">On Hold</option>
                          <option value="completed">Completed</option>
                        </select>
                      </div>
                    </div>

                    {/* Linked Parts Section */}
                    {(() => {
                      const linkedParts = parts.filter(part => part.projectId === editingProject.id);
                      if (linkedParts.length > 0) {
                        return (
                          <div className={`mt-6 pt-6 border-t ${
                            darkMode ? 'border-gray-600' : 'border-gray-200'
                          }`}>
                            <h3 className={`text-lg font-semibold mb-3 ${
                              darkMode ? 'text-gray-200' : 'text-gray-800'
                            }`}>
                              Linked Parts ({linkedParts.length})
                            </h3>
                            <div className="space-y-2 max-h-60 overflow-y-auto">
                              {linkedParts.map((part) => (
                                <div 
                                  key={part.id}
                                  className={`p-3 rounded-lg border flex items-center justify-between ${
                                    darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'
                                  }`}
                                >
                                  <div className="flex-1 min-w-0">
                                    <h4 className={`font-medium truncate ${
                                      darkMode ? 'text-gray-100' : 'text-gray-900'
                                    }`}>
                                      {part.part}
                                    </h4>
                                    <div className="flex items-center gap-2 mt-1">
                                      {part.vendor && (
                                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${getVendorColor(part.vendor)}`}>
                                          {part.vendor}
                                        </span>
                                      )}
                                      <span className={`text-sm font-bold ${
                                        darkMode ? 'text-gray-200' : 'text-gray-900'
                                      }`}>
                                        ${part.total.toFixed(2)}
                                      </span>
                                    </div>
                                  </div>
                                  <button
                                    onClick={() => unlinkPartFromProject(part.id)}
                                    className={`ml-3 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                                      darkMode 
                                        ? 'bg-red-900/30 hover:bg-red-900/50 text-red-400 border border-red-700' 
                                        : 'bg-red-50 hover:bg-red-100 text-red-600 border border-red-200'
                                    }`}
                                    title="Unlink from project"
                                  >
                                    Unlink
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      }
                      return null;
                    })()}

                    <div className="flex gap-3 mt-6">
                      <button
                        onClick={() => {
                          setShowEditProjectModal(false);
                          setEditingProject(null);
                        }}
                        className={`flex-1 px-6 py-3 rounded-lg font-medium transition-colors ${
                          darkMode 
                            ? 'bg-gray-700 hover:bg-gray-600 text-gray-100' 
                            : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
                        }`}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={async () => {
                          await updateProject(editingProject.id, {
                            name: editingProject.name,
                            description: editingProject.description,
                            budget: parseFloat(editingProject.budget),
                            spent: parseFloat(editingProject.spent),
                            priority: editingProject.priority,
                            start_date: editingProject.start_date || null,
                            target_date: editingProject.target_date || null,
                            status: editingProject.status
                          });
                          setShowEditProjectModal(false);
                          setEditingProject(null);
                        }}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                      >
                        Save Changes
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Project Detail Modal */}
            {showProjectDetailModal && viewingProject && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className={`rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto ${
                  darkMode ? 'bg-gray-800' : 'bg-white'
                }`}>
                  <div className={`sticky top-0 border-b px-6 py-4 flex items-center justify-between rounded-t-lg ${
                    darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                  }`} style={{ zIndex: 10 }}>
                    <h2 className={`text-2xl font-bold ${
                      darkMode ? 'text-gray-100' : 'text-gray-800'
                    }`} style={{ fontFamily: "'FoundationOne', 'Courier New', monospace" }}>
                      {viewingProject.name}
                    </h2>
                    <button
                      onClick={() => {
                        setShowProjectDetailModal(false);
                        setViewingProject(null);
                      }}
                      className={`transition-colors ${
                        darkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'
                      }`}
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>
                  
                  <div className="p-6">
                    {(() => {
                      const linkedParts = parts.filter(part => part.projectId === viewingProject.id);
                      const linkedPartsTotal = linkedParts.reduce((sum, part) => sum + (part.total || 0), 0);
                      const progress = viewingProject.budget > 0 ? (linkedPartsTotal / viewingProject.budget) * 100 : 0;
                      
                      const statusColors = {
                        planning: darkMode ? 'bg-gray-600 text-gray-200' : 'bg-gray-200 text-gray-800',
                        in_progress: darkMode ? 'bg-blue-600 text-blue-100' : 'bg-blue-100 text-blue-800',
                        completed: darkMode ? 'bg-green-600 text-green-100' : 'bg-green-100 text-green-800',
                        on_hold: darkMode ? 'bg-yellow-600 text-yellow-100' : 'bg-yellow-100 text-yellow-800'
                      };
                      
                      const priorityColors = {
                        low: darkMode ? 'text-green-400' : 'text-green-600',
                        medium: darkMode ? 'text-yellow-400' : 'text-yellow-600',
                        high: darkMode ? 'text-red-400' : 'text-red-600'
                      };

                      return (
                        <>
                          {/* Status Badge */}
                          <div className="mb-6">
                            <span className={`inline-block px-4 py-2 rounded-full text-sm font-medium ${
                              statusColors[viewingProject.status]
                            }`}>
                              {viewingProject.status.replace('_', ' ').toUpperCase()}
                            </span>
                          </div>

                          {/* Description */}
                          {viewingProject.description && (
                            <div className="mb-6">
                              <h3 className={`text-lg font-semibold mb-2 ${
                                darkMode ? 'text-gray-200' : 'text-gray-800'
                              }`}>Description</h3>
                              <p className={`text-base ${
                                darkMode ? 'text-gray-400' : 'text-gray-600'
                              }`}>
                                {viewingProject.description}
                              </p>
                            </div>
                          )}

                          {/* Budget Progress */}
                          <div className="mb-6">
                            <h3 className={`text-lg font-semibold mb-3 ${
                              darkMode ? 'text-gray-200' : 'text-gray-800'
                            }`}>Budget Used</h3>
                            <div className="flex justify-between items-center mb-2">
                              <span className={`text-sm font-medium ${
                                darkMode ? 'text-gray-300' : 'text-gray-700'
                              }`}>
                                ${linkedPartsTotal.toFixed(2)} / ${viewingProject.budget?.toFixed(2) || '0.00'}
                              </span>
                              <span className={`text-sm font-bold ${
                                darkMode ? 'text-gray-200' : 'text-gray-900'
                              }`}>
                                {progress.toFixed(0)}%
                              </span>
                            </div>
                            <div className={`w-full rounded-full h-4 ${
                              darkMode ? 'bg-gray-700' : 'bg-gray-200'
                            }`}>
                              <div
                                className={`h-4 rounded-full transition-all ${
                                  progress > 90
                                    ? 'bg-red-500'
                                    : progress > 70
                                    ? 'bg-yellow-500'
                                    : 'bg-green-500'
                                }`}
                                style={{ width: `${Math.min(progress, 100)}%` }}
                              />
                            </div>
                          </div>

                          {/* Project Details Grid */}
                          <div className={`grid grid-cols-2 gap-4 mb-6 p-4 rounded-lg ${
                            darkMode ? 'bg-gray-700' : 'bg-gray-50'
                          }`}>
                            <div>
                              <p className={`text-xs mb-1 ${
                                darkMode ? 'text-gray-400' : 'text-gray-600'
                              }`}>Priority</p>
                              <p className={`text-lg font-bold ${priorityColors[viewingProject.priority]}`}>
                                {viewingProject.priority?.toUpperCase()}
                              </p>
                            </div>
                            <div>
                              <p className={`text-xs mb-1 ${
                                darkMode ? 'text-gray-400' : 'text-gray-600'
                              }`}>Parts Linked</p>
                              <p className={`text-lg font-bold ${
                                darkMode ? 'text-gray-100' : 'text-gray-900'
                              }`}>
                                {linkedParts.length}
                              </p>
                            </div>
                            <div>
                              <p className={`text-xs mb-1 ${
                                darkMode ? 'text-gray-400' : 'text-gray-600'
                              }`}>Start Date</p>
                              <p className={`text-sm font-medium ${
                                darkMode ? 'text-gray-300' : 'text-gray-700'
                              }`}>
                                {viewingProject.start_date ? new Date(viewingProject.start_date).toLocaleDateString() : 'TBD'}
                              </p>
                            </div>
                            <div>
                              <p className={`text-xs mb-1 ${
                                darkMode ? 'text-gray-400' : 'text-gray-600'
                              }`}>Target Date</p>
                              <p className={`text-sm font-medium ${
                                darkMode ? 'text-gray-300' : 'text-gray-700'
                              }`}>
                                {viewingProject.target_date ? new Date(viewingProject.target_date).toLocaleDateString() : 'Not set'}
                              </p>
                            </div>
                          </div>

                          {/* Linked Parts List */}
                          {linkedParts.length > 0 && (
                            <div>
                              <h3 className={`text-lg font-semibold mb-3 ${
                                darkMode ? 'text-gray-200' : 'text-gray-800'
                              }`}>
                                Linked Parts ({linkedParts.length})
                              </h3>
                              <div className="space-y-2">
                                {linkedParts.map((part) => (
                                  <div 
                                    key={part.id}
                                    className={`p-3 rounded-lg border ${
                                      darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'
                                    }`}
                                  >
                                    <div className="flex justify-between items-start mb-2">
                                      <div className="flex-1">
                                        <h4 className={`font-medium ${
                                          darkMode ? 'text-gray-100' : 'text-gray-900'
                                        }`}>
                                          {part.part}
                                        </h4>
                                        {part.vendor && (
                                          <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium ${getVendorColor(part.vendor)}`}>
                                            {part.vendor}
                                          </span>
                                        )}
                                      </div>
                                      <div className="text-right ml-4">
                                        <p className={`text-lg font-bold ${
                                          darkMode ? 'text-gray-100' : 'text-gray-900'
                                        }`}>
                                          ${part.total.toFixed(2)}
                                        </p>
                                        <div className={`text-xs ${
                                          darkMode ? 'text-gray-400' : 'text-gray-600'
                                        }`}>
                                          {getStatusText(part)}
                                        </div>
                                      </div>
                                    </div>
                                    {part.partNumber && part.partNumber !== '-' && (
                                      <p className={`text-xs font-mono ${
                                        darkMode ? 'text-gray-400' : 'text-gray-600'
                                      }`}>
                                        Part #: {part.partNumber}
                                      </p>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {linkedParts.length === 0 && (
                            <div className={`text-center py-8 rounded-lg ${
                              darkMode ? 'bg-gray-700' : 'bg-gray-50'
                            }`}>
                              <Package className={`w-12 h-12 mx-auto mb-3 ${
                                darkMode ? 'text-gray-600' : 'text-gray-400'
                              }`} />
                              <p className={`text-sm ${
                                darkMode ? 'text-gray-400' : 'text-gray-600'
                              }`}>
                                No parts linked to this project yet
                              </p>
                            </div>
                          )}

                          {/* Action Buttons */}
                          <div className="flex gap-3 mt-6 pt-6 border-t" style={{
                            borderColor: darkMode ? '#374151' : '#e5e7eb'
                          }}>
                            <button
                              onClick={() => {
                                setEditingProject(viewingProject);
                                setShowProjectDetailModal(false);
                                setShowEditProjectModal(true);
                                setViewingProject(null);
                              }}
                              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                            >
                              <Edit2 className="w-4 h-4" />
                              Edit Project
                            </button>
                            <button
                              onClick={() => {
                                setShowProjectDetailModal(false);
                                setViewingProject(null);
                              }}
                              className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                                darkMode 
                                  ? 'bg-gray-700 hover:bg-gray-600 text-gray-100' 
                                  : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
                              }`}
                            >
                              Close
                            </button>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        </>
        )}
      </div>
    </div>
  );
};

export default LandCruiserTracker;
