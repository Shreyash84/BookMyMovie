import React, {useState} from 'react';
import { Link } from 'react-router-dom';
import { AppBar, Toolbar, IconButton, Menu, MenuItem, Typography, Button } from "@mui/material";
import MenuIcon from '@mui/icons-material/Menu';

const Navbar = () => {
  const [anchorMenu, setAnchorMenu] = useState(null);
  
  const handleMenuOpen = (e) => setAnchorMenu(e.currentTarget);
  const handleMenuClose = () => setAnchorMenu(null);

  const navLinks = [
    { title: "Home", href: "/home"},
    { title: "Movies", href: "/movies"},
    { title: "Bookings", href: "/bookings"},
    { title: "Login", href: "/login"}
  ];

  return (
    <AppBar position='static' elevation={5}>
      <div className='bg-white shadow-md text-black'>
      
      <Toolbar className='flex justify-between'>
        {/*Logo */}
        <Typography variant="h5" className="text-slate-800 font-bold">
          <a href="/home" className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-600 rounded-md flex items-center justify-center text-white font-bold">B</div>
              <span className="font-semibold text-lg text-slate-900 sm:inline">BookMyMovie</span>
          </a>
        </Typography>
        {/* Desktop Links */}
        <div className="hidden md:flex gap-4">
          {navLinks.map((link) => (
            <Link 
              key={link.title}
              to={link.href}
              className="px-4 py-2 text-blue-500 hover:text-blue-700 hover:bg-slate-100 rounded transition-colors"
            >
              {link.title}
            </Link>
          ))}
        </div>

        {/* Mobile Menu */}
        <div className="md:hidden">
            <IconButton onClick={handleMenuOpen} color="inherit">
              <MenuIcon className="text-red-500" />
            </IconButton>
            <Menu
              anchorMenu={anchorMenu}
              open={Boolean(anchorMenu)}
              onClose={handleMenuClose}
              anchorOrigin={{
                vertical: "top",
                horizontal: "right"
              }}
              transformOrigin={{
              vertical: "top",
              horizontal: "right",
              }}
              
            >
              {navLinks.map((link) => (
                <MenuItem key={link.title} onClick={handleMenuClose}>
                  <a href={link.href} className="text-blue-500 w-full block">{link.title}</a>
                  </MenuItem>
              ))}
              </Menu>
        </div>
      </Toolbar>
      </div>
    </AppBar>
  );
}

export default Navbar;