'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Employee } from '@/lib/types/employee';
import employeesData from '@/data/employees.json';

interface AuthContextType {
  employee: Employee | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (name: string, employeeId: string) => boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if there's a logged-in employee in localStorage
    const storedEmployee = localStorage.getItem('authenticatedEmployee');
    if (storedEmployee) {
      try {
        setEmployee(JSON.parse(storedEmployee));
      } catch (error) {
        console.error('Error parsing stored employee:', error);
        localStorage.removeItem('authenticatedEmployee');
      }
    }
    setIsLoading(false);
  }, []);

  const login = (name: string, employeeId: string): boolean => {
    // Find employee matching both name and employee ID
    const foundEmployee = (employeesData as Employee[]).find(
      (emp) =>
        emp.name.toLowerCase() === name.toLowerCase() &&
        emp.id === employeeId
    );

    if (foundEmployee) {
      setEmployee(foundEmployee);
      localStorage.setItem('authenticatedEmployee', JSON.stringify(foundEmployee));
      return true;
    }
    return false;
  };

  const logout = () => {
    setEmployee(null);
    localStorage.removeItem('authenticatedEmployee');
  };

  return (
    <AuthContext.Provider
      value={{
        employee,
        isAuthenticated: !!employee,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
}
