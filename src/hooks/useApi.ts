import { useQuery, useMutation, UseQueryResult, UseMutationResult } from '@tanstack/react-query';
import * as types from '../types';
import { opusApiClient } from '../services/api';

/**
 * Hook for analyzing requirements
 */
export function useAnalyzeRequirement(
  onSuccess?: (data: types.RequirementAnalysisResponse) => void,
  onError?: (error: types.ApiError) => void
): UseMutationResult<types.ApiResponse<types.RequirementAnalysisResponse>, unknown, types.RequirementAnalysisRequest> {
  return useMutation({
    mutationFn: (request: types.RequirementAnalysisRequest) =>
      opusApiClient.analyzeRequirement(request),
    onSuccess: (data) => onSuccess?.(data.data),
    onError: (error: any) => onError?.(error),
  });
}

/**
 * Hook for provisioning ephemeral environments
 */
export function useProvisionEnvironment(
  onSuccess?: (data: types.EnvironmentProvisionResponse) => void,
  onError?: (error: types.ApiError) => void
): UseMutationResult<types.ApiResponse<types.EnvironmentProvisionResponse>, unknown, types.EnvironmentProvisionRequest> {
  return useMutation({
    mutationFn: (request: types.EnvironmentProvisionRequest) =>
      opusApiClient.provisionEnvironment(request),
    onSuccess: (data) => onSuccess?.(data.data),
    onError: (error: any) => onError?.(error),
  });
}

/**
 * Hook for fetching environment status
 */
export function useEnvironmentStatus(
  environmentId: string | null
): UseQueryResult<types.EnvironmentProvisionResponse> {
  return useQuery({
    queryKey: ['environment', environmentId],
    queryFn: () =>
      opusApiClient
        .getEnvironmentStatus(environmentId!)
        .then((response) => response.data),
    enabled: !!environmentId,
    refetchInterval: 5000, // Poll every 5 seconds
  });
}

/**
 * Hook for destroying environments
 */
export function useDestroyEnvironment(
  onSuccess?: () => void,
  onError?: (error: types.ApiError) => void
): UseMutationResult<void, unknown, string> {
  return useMutation({
    mutationFn: (environmentId: string) =>
      opusApiClient.destroyEnvironment(environmentId),
    onSuccess: () => onSuccess?.(),
    onError: (error: any) => onError?.(error),
  });
}

/**
 * Hook for analyzing code impact
 */
export function useAnalyzeCodeImpact(
  onSuccess?: (data: types.ImpactAnalysisResponse) => void,
  onError?: (error: types.ApiError) => void
): UseMutationResult<types.ApiResponse<types.ImpactAnalysisResponse>, unknown, types.ImpactAnalysisRequest> {
  return useMutation({
    mutationFn: (request: types.ImpactAnalysisRequest) =>
      opusApiClient.analyzeCodeImpact(request),
    onSuccess: (data) => onSuccess?.(data.data),
    onError: (error: any) => onError?.(error),
  });
}

/**
 * Hook for healing broken locators
 */
export function useHealLocator(
  onSuccess?: (data: types.HealLocatorResponse) => void,
  onError?: (error: types.ApiError) => void
): UseMutationResult<types.ApiResponse<types.HealLocatorResponse>, unknown, types.HealLocatorRequest> {
  return useMutation({
    mutationFn: (request: types.HealLocatorRequest) =>
      opusApiClient.healLocator(request),
    onSuccess: (data) => onSuccess?.(data.data),
    onError: (error: any) => onError?.(error),
  });
}

/**
 * Hook for health check
 */
export function useHealthCheck(): UseQueryResult<{ status: string; version: string }> {
  return useQuery({
    queryKey: ['health'],
    queryFn: () =>
      opusApiClient
        .healthCheck()
        .then((response) => response.data),
    refetchInterval: 30000, // Check every 30 seconds
  });
}
