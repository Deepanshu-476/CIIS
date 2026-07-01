import { useState, useMemo, useEffect } from "react"
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  Typography,
  Tabs,
  Tab,
  Stack,
  Avatar,
  TextField,
  MenuItem,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TableContainer,
  Paper,
  TablePagination,
} from "@mui/material"
import { Download, FilterList, Group } from "@mui/icons-material"
import { Grid } from "@mui/system"
import axiosInstance from "../../utils/axiosConfig"


const designations = ["Software Engineer", "Product Manager"]
const genders = ["Male", "Female"]
const departments = ["Engineering", "Product"]
const locations = ["New York", "San Francisco"]

function FilterBar({ filters, onFiltersChange, onReset }) {
  const handleChange = (e) => {
    onFiltersChange({ ...filters, [e.target.name]: e.target.value })
  }

  return (
    <Box mb={3}>
      <Stack direction="row" spacing={2} alignItems="center" flexWrap="nowrap" sx={{ overflowX: "auto" }}>
        

        

        

        

        <TextField
          label="Search by Name"
          name="search"
          value={filters.search}
          onChange={handleChange}
          size="small"
          sx={{ minWidth: 180, flexShrink: 0 }}
        />

        <Button
          onClick={onReset}
          variant="text"
          size="small"
          sx={{ color: "primary.main", minWidth: 60 }}
        >
          Reset

          
        </Button>
      </Stack>
    </Box>
  )
}

function People() {
  const [filters, setFilters] = useState({
    designation: "",
    gender: "",
    department: "",
    location: "",
    search: "",
  })

  const [tabIndex, setTabIndex] = useState(1)
  const [page, setPage] = useState(0)
  const rowsPerPage = 10
  const [allUsers, setAllUsers] = useState([])

  const getAllUsers = async () => {
    try {
      const response = await axiosInstance.get('/users/all-users')
      setAllUsers(response.data)
      void 0
    } catch (error) {
      console.error("Error fetching users:", error)
    }
  }

  useEffect(() => {
    getAllUsers()
  }, [])

  const filteredEmployees = useMemo(() => {
    return allUsers.filter((employee) => {
      const matchesDesignation = !filters.designation || employee.designation === filters.designation
      const matchesGender = !filters.gender || employee.gender === filters.gender
      const matchesDepartment = !filters.department || employee.department === filters.department
      const matchesLocation = !filters.location || employee.location === filters.location
      const matchesSearch =
        !filters.search ||
        employee.name.toLowerCase().includes(filters.search.toLowerCase()) ||
        (employee.email && employee.email.toLowerCase().includes(filters.search.toLowerCase()))
      return matchesDesignation && matchesGender && matchesDepartment && matchesLocation && matchesSearch
    })
  }, [filters, allUsers])

  const handleReset = () => {
    setFilters({
      
      
      
      
      search: "",
    })
    setPage(0)
  }

  const exportData = () => {
    const csvContent = [
      ["Name", "Designation", "Department", "Location", "Email", "Mobile", "Birthday"],
      ...filteredEmployees.map((emp) => [
        emp.name,
        emp.designation,
        emp.department,
        emp.location,
        emp.email || "",
        emp.mobile,
        emp.birthday,
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "organization-directory.csv"
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const paginatedEmployees = filteredEmployees.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  )

  return (
    <Box sx={{ maxWidth: "1280px", mx: "auto", p: 3, bgcolor: "white", minHeight: "100vh" }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight="bold">
          People
        </Typography>
        <Stack direction="row" spacing={2} alignItems="center">
          <Chip
            icon={<Group fontSize="small" />}
            label={`${filteredEmployees.length} employees`}
            variant="outlined"
          />
          <Button variant="outlined" startIcon={<Download />} onClick={exportData}>
            Export
          </Button>
        </Stack>
      </Box>

      <Tabs value={tabIndex} onChange={(_, newValue) => setTabIndex(newValue)} sx={{ maxWidth: 400 }}>
        
        
      </Tabs>

      {tabIndex === 0 && (
        <Card sx={{ mt: 3 }}>
          <CardHeader title="Organization Chart" />
          <CardContent>
            <Box display="flex" justifyContent="center" alignItems="center" height={200} color="text.secondary">
              Organization chart view coming soon...
            </Box>
          </CardContent>
        </Card>
      )}

      {tabIndex === 1 && (
        <Box mt={3}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h5">Organization Directory</Typography>
            <Stack direction="row" alignItems="center" spacing={1}>
              <FilterList fontSize="small" color="action" />
              <Typography variant="body2" color="text.secondary">
                {Object.values(filters).filter(Boolean).length} filters applied
              </Typography>
            </Stack>
          </Box>

          <FilterBar
            filters={filters}
            onFiltersChange={setFilters}
            onReset={handleReset}
          />

          {filteredEmployees.length === 0 ? (
            <Card>
              <CardContent>
                <Box display="flex" justifyContent="center" alignItems="center" flexDirection="column" height={150}>
                  <Group sx={{ opacity: 0.5 }} fontSize="large" />
                  <Typography color="text.secondary">No employees found matching your criteria</Typography>
                </Box>
              </CardContent>
            </Card>
          ) : (
            <Paper>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Name</TableCell>
                      
                      
                      
                      
                      <TableCell>Email</TableCell>
                      <TableCell>Mobile</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {paginatedEmployees.map((emp) => (
                      <TableRow key={emp.id}>
                        <TableCell>
                          <Stack direction="row" spacing={1} alignItems="center">
                            <Avatar src={emp.image} alt={emp.name} />
                            <Typography>{emp.name}</Typography>
                          </Stack>
                        </TableCell>
                        
                        
                        
                        
                        <TableCell>{emp.email}</TableCell>
                        <TableCell>{emp.mobile}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              <TablePagination
                component="div"
                count={filteredEmployees.length}
                page={page}
                onPageChange={(_, newPage) => setPage(newPage)}
                rowsPerPage={rowsPerPage}
                rowsPerPageOptions={[rowsPerPage]}
              />
            </Paper>
          )}
        </Box>
      )}
    </Box>
  )
}

export default People;