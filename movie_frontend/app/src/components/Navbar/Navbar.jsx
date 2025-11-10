import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  AppBar,
  Toolbar,
  IconButton,
  Menu,
  MenuItem,
  Typography,
  Avatar,
  Divider,
  Box,
  Button,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import LogoutIcon from "@mui/icons-material/Logout";
import LoginIcon from "@mui/icons-material/Login";
import ConfirmationNumberIcon from "@mui/icons-material/ConfirmationNumber"; // 🎟️ for MyBookings icon
import { useAuth } from "../Context/AuthContext";

const Navbar = () => {
  const [anchorElNav, setAnchorElNav] = useState(null);
  const [anchorElUser, setAnchorElUser] = useState(null);
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const navLinks = [
    { title: "Home", href: "/" },
    { title: "Movies", href: "/movies" },
  ];

  // --- Handlers ---
  const handleNavOpen = (e) => setAnchorElNav(e.currentTarget);
  const handleNavClose = () => setAnchorElNav(null);
  const handleUserMenuOpen = (e) => setAnchorElUser(e.currentTarget);
  const handleUserMenuClose = () => setAnchorElUser(null);
  const handleLogout = () => {
    logout();
    handleUserMenuClose();
    navigate("/");
  };

  // --- Avatar fallback ---
  const avatarSeed = user?.name || user?.email?.split("@")[0] || "guest";
  const avatarSrc =
    user?.picture || `https://api.dicebear.com/8.x/identicon/svg?seed=${avatarSeed}`;

  return (
    <AppBar
      position="static"
      elevation={0}
      sx={{
        backgroundColor: "white",
        boxShadow: "0 1px 3px 0 rgb(0 0 0 / 0.1)",
        color: "text.primary",
      }}
    >
      <Toolbar sx={{ justifyContent: "space-between", gap: 2 }}>
        {/* Logo */}
        <Typography
          variant="h5"
          sx={{
            fontWeight: "bold",
            display: "flex",
            alignItems: "center",
            gap: 2,
          }}
        >
          <Link
            to="/"
            style={{
              display: "flex",
              alignItems: "center",
              textDecoration: "none",
              color: "inherit",
            }}
          >
            <Box
              sx={{
                width: 40,
                height: 40,
                bgcolor: "error.main",
                borderRadius: 2,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "white",
                fontWeight: "bold",
                fontSize: "1.25rem",
              }}
            >
              B
            </Box>
            <span className="font-semibold ml-2 text-xl text-slate-900">
              BookMyMovie
            </span>
          </Link>
        </Typography>

        {/* Desktop Nav */}
        <Box
          sx={{
            display: { xs: "none", md: "flex" },
            alignItems: "center",
            gap: 2,
          }}
        >
          {navLinks.map((link) => (
            <Button
              key={link.title}
              component={Link}
              to={link.href}
              sx={{
                color: "primary.main",
                textTransform: "none",
                fontWeight: 500,
                "&:hover": { bgcolor: "grey.50", color: "primary.dark" },
              }}
            >
              {link.title}
            </Button>
          ))}

          {/* 🟢 My Bookings (only visible when logged in)
          {isAuthenticated && (
            <Button
              component={Link}
              to="/mybookings"
              startIcon={<ConfirmationNumberIcon />}
              sx={{
                color: "primary.main",
                textTransform: "none",
                fontWeight: 500,
                "&:hover": { bgcolor: "grey.50", color: "primary.dark" },
              }}
            >
              My Bookings
            </Button>
          )} */}

          {/* Auth Section */}
          {isAuthenticated ? (
            <>
              <Typography
                variant="body1"
                sx={{
                  color: "text.secondary",
                  textTransform: "capitalize",
                }}
              >
                Hi {user?.name?.split(" ")[0] || user?.email?.split("@")[0] || "User"}
              </Typography>
              <IconButton onClick={handleUserMenuOpen} size="small">
                <Avatar alt={user?.name} src={avatarSrc} sx={{ width: 36, height: 36 }} />
              </IconButton>
              <Menu
                anchorEl={anchorElUser}
                open={Boolean(anchorElUser)}
                onClose={handleUserMenuClose}
                anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                transformOrigin={{ vertical: "top", horizontal: "right" }}
                PaperProps={{
                  sx: {
                    width: 220,
                    mt: 0.5,
                    borderRadius: 2,
                    boxShadow: 3,
                    border: "1px solid",
                    borderColor: "grey.200",
                  },
                }}
              >
                <Box sx={{ px: 2, py: 1.5, borderBottom: 1, borderColor: "grey.100" }}>
                  <Typography sx={{ fontWeight: 600, textTransform: "capitalize" }}>
                    {user?.name || user?.email?.split("@")[0]}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {user?.email}
                  </Typography>
                </Box>

                {/* My Bookings inside menu (for redundancy on mobile) */}
                <MenuItem
                  component={Link}
                  to="/mybookings"
                  onClick={handleUserMenuClose}
                  sx={{
                    "&:hover": { bgcolor: "grey.50" },
                  }}
                >
                  <ConfirmationNumberIcon sx={{ mr: 1, fontSize: 18, color: "primary.main" }} />
                  My Bookings
                </MenuItem>

                <MenuItem
                  onClick={handleLogout}
                  sx={{
                    color: "error.main",
                    "&:hover": { bgcolor: "error.50" },
                  }}
                >
                  <LogoutIcon sx={{ mr: 1, fontSize: 18 }} />
                  Logout
                </MenuItem>
              </Menu>
            </>
          ) : (
            <Button
              component={Link}
              to="/login"
              startIcon={<LoginIcon />}
              sx={{
                color: "primary.main",
                textTransform: "none",
                fontWeight: 500,
                "&:hover": { bgcolor: "grey.50", color: "primary.dark" },
              }}
            >
              Login
            </Button>
          )}
        </Box>

        {/* Mobile Menu */}
        <IconButton
          onClick={handleNavOpen}
          sx={{ display: { md: "none" }, color: "error.main" }}
        >
          <MenuIcon />
        </IconButton>
        <Menu
          anchorEl={anchorElNav}
          open={Boolean(anchorElNav)}
          onClose={handleNavClose}
          PaperProps={{
            sx: {
              mt: 1,
              borderRadius: 2,
              minWidth: 200,
              boxShadow: 3,
              backgroundColor: "grey.50",
            },
          }}
        >
          {isAuthenticated && [
            <MenuItem key="profile" sx={{ py: 1.5 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <Avatar alt={user?.name} src={avatarSrc} sx={{ width: 38, height: 38 }} />
                <Box>
                  <Typography sx={{ fontWeight: 600 }}>
                    {user?.name || user?.email?.split("@")[0]}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {user?.email}
                  </Typography>
                </Box>
              </Box>
            </MenuItem>,
            <Divider key="divider" />,
          ]}

          {navLinks.map((link) => (
            <MenuItem key={link.title} onClick={handleNavClose}>
              <Typography
                component={Link}
                to={link.href}
                sx={{
                  color: "primary.main",
                  fontWeight: 500,
                  textDecoration: "none",
                  width: "100%",
                  textAlign: "center",
                }}
              >
                {link.title}
              </Typography>
            </MenuItem>
          ))}

          {/* My Bookings in mobile nav */}
          {isAuthenticated && (
            <MenuItem onClick={handleNavClose}>
              <Typography
                component={Link}
                to="/mybookings"
                sx={{
                  color: "primary.main",
                  fontWeight: 500,
                  textDecoration: "none",
                  width: "100%",
                  textAlign: "center",
                }}
              >
                My Bookings
              </Typography>
            </MenuItem>
          )}

          <Divider />

          {isAuthenticated ? (
            <MenuItem
              onClick={handleLogout}
              sx={{
                color: "error.main",
                justifyContent: "center",
                "&:hover": { bgcolor: "error.50" },
              }}
            >
              <LogoutIcon sx={{ mr: 1, fontSize: 18 }} />
              Logout
            </MenuItem>
          ) : (
            <MenuItem onClick={handleNavClose}>
              <Typography
                component={Link}
                to="/login"
                sx={{
                  color: "primary.main",
                  fontWeight: 500,
                  textDecoration: "none",
                  width: "100%",
                  textAlign: "center",
                }}
              >
                Login
              </Typography>
            </MenuItem>
          )}
        </Menu>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;
