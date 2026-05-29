import React from "react";
import {
  Box,
  Typography,
  Paper,
  Button,
} from "@mui/material";
import SupportAgentIcon from "@mui/icons-material/SupportAgent";
import ChatIcon from "@mui/icons-material/Chat";
import { useNavigate } from "react-router-dom";

const ContactSupport = () => {
  const navigate = useNavigate();

  const handleStartSupport = () => {
    navigate("/ciisUser/chat");
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "#f4f6f8",
        p: 3,
      }}
    >
      <Paper
        elevation={4}
        sx={{
          maxWidth: 500,
          width: "100%",
          p: 5,
          borderRadius: 4,
          textAlign: "center",
        }}
      >
        <SupportAgentIcon
          sx={{
            fontSize: 80,
            color: "#1976d2",
            mb: 2,
          }}
        />

        <Typography
          variant="h4"
          fontWeight="bold"
          gutterBottom
        >
          Contact Support
        </Typography>

        <Typography
          variant="body1"
          color="text.secondary"
          sx={{ mb: 4 }}
        >
          Need help? Start a support conversation with
          our team instantly.
        </Typography>

        <Button
          variant="contained"
          size="large"
          startIcon={<ChatIcon />}
          onClick={handleStartSupport}
          sx={{
            px: 4,
            py: 1.5,
            borderRadius: 3,
            textTransform: "none",
            fontWeight: "bold",
            fontSize: "16px",
          }}
        >
          Start Support Chat
        </Button>
      </Paper>
    </Box>
  );
};

export default ContactSupport;