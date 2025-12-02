"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import RoutesList from "@/components/routes/RoutesList";
import ConfirmModal from "@/components/ui/ConfirmModal";

// Dynamically import map component to avoid SSR issues
const AddRouteMap = dynamic(() => import("@/components/routes/AddRouteMap"), {
  ssr: false,
  loading: () => (
    <div className="h-96 bg-gray-100 animate-pulse rounded-lg flex items-center justify-center">
      Loading map...
    </div>
  ),
});

interface Coordinate {
  lat: number;
  lng: number;
  label?: string;
}

interface Contribution {
  id: string;
  route_code: string;
  contributor_name: string;
  contributor_email?: string;
  forward_geojson: {
    type: string;
    coordinates: [number, number][];
  };
  status: string;
  created_at: string;
  review_notes?: string;
}

export default function EnhancedAddRoutePage() {
  const [activeTab, setActiveTab] = useState<"add" | "list" | "review">("add");
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [loadingContributions, setLoadingContributions] = useState(false);
  const [selectedContribution, setSelectedContribution] =
    useState<Contribution | null>(null);
  const [reviewAction, setReviewAction] = useState<"approve" | "reject" | null>(
    null
  );
  const [reviewNotes, setReviewNotes] = useState("");
  const [formData, setFormData] = useState({
    route_code: "",
  });

  const [mapCoordinates, setMapCoordinates] = useState<Coordinate[]>([]);
  const [status, setStatus] = useState({ type: "", message: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedPointIndex, setSelectedPointIndex] = useState<number | null>(
    null
  );
  const [insertMode, setInsertMode] = useState(false);
  const [showPointNumbers, setShowPointNumbers] = useState(true);
  const [hidePOIs, setHidePOIs] = useState(false);
  const [showCloseLoopModal, setShowCloseLoopModal] = useState(false);
  const [editingContributionId, setEditingContributionId] = useState<
    string | null
  >(null);
  const [contributionCoordinates, setContributionCoordinates] = useState<
    Coordinate[]
  >([]);
  const [selectedContribPointIndex, setSelectedContribPointIndex] = useState<
    number | null
  >(null);

  useEffect(() => {
    // Fetch contributions on component mount to show badge count
    fetchContributions();
  }, []);

  // Parse coordinates for map display - create a deep copy to prevent mutation
  const getDisplayCoordinates = (): [number, number][] => {
    return mapCoordinates.map((coord) => [coord.lng, coord.lat]);
  };

  const handleSegmentClick = (afterIndex: number, lat: number, lng: number) => {
    // Insert a new point after the specified index
    const newPointIndex = afterIndex + 1;

    setMapCoordinates((prevCoords) => {
      const newPoint = { lat, lng, label: "" };
      const updatedCoords = [
        ...prevCoords.slice(0, newPointIndex),
        newPoint,
        ...prevCoords.slice(newPointIndex),
      ];
      // Re-label all points
      return updatedCoords.map((coord, i) => ({
        ...coord,
        label: `Point ${i + 1}`,
      }));
    });

    // Auto-select the newly inserted point (this is intentional for insertions)
    setSelectedPointIndex(newPointIndex);

    // Scroll to the new point
    setTimeout(() => {
      const pointsList = document.getElementById("points-list");
      const newElement = document.querySelector(`#point-${newPointIndex}`);
      if (pointsList && newElement) {
        newElement.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }, 100);
  };

  const handleMapClick = (lat: number, lng: number) => {
    if (insertMode && selectedPointIndex !== null) {
      // Insert new point after the selected point
      setMapCoordinates((prevCoords) => {
        const newPoint = { lat, lng, label: "" };
        const updatedCoords = [
          ...prevCoords.slice(0, selectedPointIndex + 1),
          newPoint,
          ...prevCoords.slice(selectedPointIndex + 1),
        ];
        // Re-label all points
        return updatedCoords.map((coord, i) => ({
          ...coord,
          label: `Point ${i + 1}`,
        }));
      });

      // Exit insert mode and deselect
      setInsertMode(false);
      setSelectedPointIndex(null);

      // Scroll to the new point
      setTimeout(() => {
        const pointsList = document.getElementById("points-list");
        const newElement = document.querySelector(
          `#point-${selectedPointIndex + 1}`
        );
        if (pointsList && newElement) {
          newElement.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }, 100);
    } else if (!insertMode && selectedPointIndex !== null) {
      // Update existing point at its current position
      setMapCoordinates((prevCoords) => {
        if (
          !prevCoords ||
          prevCoords.length === 0 ||
          selectedPointIndex >= prevCoords.length
        ) {
          return prevCoords;
        }

        return prevCoords.map((coord, index) => {
          if (index === selectedPointIndex) {
            // Update this point with new lat/lng, keeping the label
            return {
              ...coord,
              lat,
              lng,
            };
          }
          return coord;
        });
      });
      // Keep the point selected after editing to avoid confusion
      // User can click elsewhere or press Escape to deselect
      // setSelectedPointIndex(null);
    } else {
      // Check if this is a closed loop
      const isClosedLoop =
        mapCoordinates.length > 2 &&
        Math.abs(
          mapCoordinates[0].lat - mapCoordinates[mapCoordinates.length - 1].lat
        ) < 0.000001 &&
        Math.abs(
          mapCoordinates[0].lng - mapCoordinates[mapCoordinates.length - 1].lng
        ) < 0.000001;

      if (isClosedLoop) {
        // Don't allow adding points at the end for closed loops
        alert(
          "This route is a closed loop. You can only add points between existing segments.\n\nTo add a point:\n1. Select an existing point\n2. Click 'Insert' button\n3. Click on the map where you want the new point"
        );
        return;
      }

      // Add new point at the end
      const newIndex = mapCoordinates.length;
      const newCoord = { lat, lng, label: `Point ${newIndex + 1}` };
      setMapCoordinates([...mapCoordinates, newCoord]);

      // Don't auto-select when adding new points at the end
    }
  };

  const handlePointSelect = (index: number) => {
    if (selectedPointIndex === index) {
      // Deselect if clicking the same point
      setSelectedPointIndex(null);
      setInsertMode(false); // Also exit insert mode when deselecting
    } else {
      // Select the point
      setSelectedPointIndex(index);
      setInsertMode(false); // Reset insert mode when selecting a different point
    }
  };

  const removeMapCoordinate = (index: number) => {
    setMapCoordinates((prev) => {
      const updated = prev.filter((_, i) => i !== index);
      // Re-label points after removal
      return updated.map((coord, i) => ({
        ...coord,
        label: `Point ${i + 1}`,
      }));
    });
    if (selectedPointIndex === index) {
      setSelectedPointIndex(null);
    } else if (selectedPointIndex !== null && selectedPointIndex > index) {
      // Adjust selected index if it's after the removed point
      setSelectedPointIndex(selectedPointIndex - 1);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setStatus({ type: "", message: "" });

    try {
      if (mapCoordinates.length < 2) {
        throw new Error("Please add at least 2 points on the map");
      }
      const coordinates_forward: [number, number][] = mapCoordinates.map(
        (coord) => [coord.lng, coord.lat]
      );

      const response = await fetch("/api/routes/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          route_code: formData.route_code,
          start_point_name: "Terminal A",
          end_point_name: "Terminal B",
          coordinates_forward,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setStatus({
          type: "success",
          message: `Route ${result.route.route_code} added successfully!`,
        });

        // Reset form
        setFormData({
          route_code: "",
        });
        setMapCoordinates([]);

        // Switch to list view after successful add
        setTimeout(() => {
          setActiveTab("list");
        }, 2000);
      } else {
        throw new Error(result.error || "Failed to add route");
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "An error occurred";
      setStatus({
        type: "error",
        message: errorMessage,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const fetchContributions = async () => {
    setLoadingContributions(true);
    try {
      const response = await fetch("/api/routes/contribute?status=pending");
      const data = await response.json();
      if (data.success) {
        setContributions(data.contributions);
      }
    } catch (error) {
      console.error("Error fetching contributions:", error);
    } finally {
      setLoadingContributions(false);
    }
  };

  const handleApproveContribution = async (contribution: Contribution) => {
    try {
      // First, add the route to the main routes table
      const response = await fetch("/api/routes/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          route_code: contribution.route_code,
          start_point_name: "Terminal A",
          end_point_name: "Terminal B",
          coordinates_forward: contribution.forward_geojson.coordinates,
        }),
      });

      const result = await response.json();

      if (result.success) {
        // Update contribution status to approved
        await fetch(`/api/routes/contribute/${contribution.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status: "approved",
            review_notes: reviewNotes,
            transferred_route_id: result.route.id,
          }),
        });

        // Refresh contributions list
        fetchContributions();
        setSelectedContribution(null);
        setReviewAction(null);
        setReviewNotes("");

        alert(
          `Route ${contribution.route_code} has been approved and added to the system!`
        );
      }
    } catch (error) {
      console.error("Error approving contribution:", error);
      alert("Failed to approve contribution");
    }
  };

  const handleRejectContribution = async (contribution: Contribution) => {
    try {
      await fetch(`/api/routes/contribute/${contribution.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "rejected",
          review_notes: reviewNotes,
        }),
      });

      fetchContributions();
      setSelectedContribution(null);
      setReviewAction(null);
      setReviewNotes("");

      alert(`Route ${contribution.route_code} has been rejected.`);
    } catch (error) {
      console.error("Error rejecting contribution:", error);
      alert("Failed to reject contribution");
    }
  };

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setStatus({ type: "info", message: "Processing file..." });

      const fileContent = await readFileAsText(file);
      let coordinates: Coordinate[] = [];

      if (file.name.endsWith(".kml")) {
        coordinates = parseKML(fileContent);
      } else if (file.name.endsWith(".kmz")) {
        // For KMZ, we'd need to extract and parse - for now, show error
        setStatus({
          type: "error",
          message:
            "KMZ files are not yet supported. Please convert to KML first.",
        });
        return;
      }

      if (coordinates.length === 0) {
        setStatus({
          type: "error",
          message: "No valid coordinates found in the file.",
        });
        return;
      }

      // Clear existing points and add new ones
      setMapCoordinates(coordinates);
      setSelectedPointIndex(null);
      setStatus({
        type: "success",
        message: `Successfully loaded ${coordinates.length} points from ${file.name}`,
      });
    } catch (error) {
      console.error("Error processing file:", error);
      setStatus({
        type: "error",
        message: "Error processing file. Please check the file format.",
      });
    }
  };

  const readFileAsText = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result;
        if (typeof result === "string") {
          resolve(result);
        } else {
          reject(new Error("Failed to read file as text"));
        }
      };
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsText(file);
    });
  };

  const parseKML = (kmlContent: string): Coordinate[] => {
    try {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(kmlContent, "text/xml");

      // Check for parsing errors
      const parserError = xmlDoc.querySelector("parsererror");
      if (parserError) {
        throw new Error("Invalid KML format");
      }

      const coordinates: Coordinate[] = [];

      // Look for coordinates in LineString elements
      const lineStrings = xmlDoc.querySelectorAll(
        "LineString coordinates, Polygon coordinates"
      );

      lineStrings.forEach((coordElement) => {
        const coordText = coordElement.textContent?.trim();
        if (!coordText) return;

        // KML coordinates are in format: longitude,latitude,altitude (altitude is optional)
        const coordPairs = coordText
          .split(/\s+/)
          .filter((pair) => pair.length > 0);

        coordPairs.forEach((pair) => {
          const [lng, lat] = pair.split(",");
          const longitude = parseFloat(lng);
          const latitude = parseFloat(lat);

          if (!isNaN(longitude) && !isNaN(latitude)) {
            coordinates.push({
              lat: latitude,
              lng: longitude,
              label: `Point ${coordinates.length + 1}`,
            });
          }
        });
      });

      // If no LineString coordinates found, look for Point coordinates
      if (coordinates.length === 0) {
        const points = xmlDoc.querySelectorAll("Point coordinates");
        points.forEach((coordElement) => {
          const coordText = coordElement.textContent?.trim();
          if (!coordText) return;

          const [lng, lat] = coordText.split(",");
          const longitude = parseFloat(lng);
          const latitude = parseFloat(lat);

          if (!isNaN(longitude) && !isNaN(latitude)) {
            coordinates.push({
              lat: latitude,
              lng: longitude,
              label: `Point ${coordinates.length + 1}`,
            });
          }
        });
      }

      return coordinates;
    } catch (error) {
      console.error("Error parsing KML:", error);
      throw new Error("Failed to parse KML file");
    }
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Route Management</h1>
        <p className="text-white mt-1">Add and manage jeepney routes</p>
      </div>

      <div className="container bg-[#404040] rounded-2xl transition-all">
        {/* Tab Navigation */}
        <div className="rounded-lg mt-6">
          <div className="flex">
            <button
              onClick={() => setActiveTab("add")}
              className={`px-6 py-3 font-medium transition-colors ${
                activeTab === "add"
                  ? "text-white border-b-3 border-[#FFCC66]"
                  : "text-gray-500 hover:text-gray-400"
              }`}
            >
              Add New Route
            </button>
            <button
              onClick={() => setActiveTab("list")}
              className={`px-6 py-3 font-medium transition-colors ${
                activeTab === "list"
                  ? "text-white border-b-3 border-[#FFCC66]"
                  : "text-gray-500 hover:text-gray-400"
              }`}
            >
              View All Routes
            </button>
            <button
              onClick={() => {
                setActiveTab("review");
                if (activeTab !== "review") {
                  fetchContributions();
                }
              }}
              className={`px-6 py-3 font-medium transition-colors relative ${
                activeTab === "review"
                  ? "text-white border-b-3 border-[#FFCC66]"
                  : "text-gray-500 hover:text-gray-400"
              }`}
            >
              Review Contributions
              {contributions.filter((c) => c.status === "pending").length >
                0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {contributions.filter((c) => c.status === "pending").length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Content */}
        {activeTab === "add" ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 p-3">
            {/* Form Section */}
            <div className="p-2">
              <h2 className="text-xl font-bold text-gray-200 mb-2">
                ROUTE DETAILS
              </h2>

              <form
                onSubmit={handleSubmit}
                className="space-y-6 border-2 border-[#CC9933] rounded-lg p-4"
              >
                {/* Basic Information */}
                <div className="grid grid-cols-12 gap-4">
                  {/* Route Code */}
                  <div className="col-span-4">
                    <div className="col-span-1">
                      <label className="block text-sm font-semibold text-white mb-1">
                        Route Code
                        <span className="text-red-500 ml-0.5"> *</span>
                      </label>
                      <input
                        type="text"
                        value={formData.route_code}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            route_code: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-black bg-white focus:outline-none focus:ring-2 focus:ring-gray-500"
                        placeholder="e.g., 01A"
                        required
                      />
                    </div>
                  </div>

                  {/* KML/KMZ Upload */}
                  <div className="col-span-8">
                    <label className="block text-sm font-semibold text-white mb-2">
                      Import Route from KML/KMZ (Optional)
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="file"
                        accept=".kml,.kmz"
                        onChange={handleFileUpload}
                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                        id="kml-upload"
                      />
                      {mapCoordinates.length > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            setMapCoordinates([]);
                            setSelectedPointIndex(null);
                            // Reset file input
                            const fileInput = document.getElementById(
                              "kml-upload"
                            ) as HTMLInputElement;
                            if (fileInput) fileInput.value = "";
                          }}
                          className="px-3 py-2 text-xs font-bold text-black rounded-lg bg-[#FFCC66] hover:bg-[#CC9933]"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mt-2">
                      Upload a KML or KMZ file to automatically load route
                      coordinates
                    </p>
                  </div>
                </div>

                {/* Coordinates Input */}
                <div className="border-t-2 border-[#2D2D2D] pt-4">
                  <div>
                    <label className="block text-sm font-semibold text-white mb-1">
                      Added Points ({mapCoordinates.length})
                      {mapCoordinates.length > 2 &&
                        Math.abs(
                          mapCoordinates[0].lat -
                            mapCoordinates[mapCoordinates.length - 1].lat
                        ) < 0.000001 &&
                        Math.abs(
                          mapCoordinates[0].lng -
                            mapCoordinates[mapCoordinates.length - 1].lng
                        ) < 0.000001 && (
                          <span className="ml-2 text-[#CC9933] text-xs font-medium">
                            🔄 Closed Loop - Use Insert to add points
                          </span>
                        )}
                    </label>
                    <div
                      id="points-list"
                      className="space-y-2 h-64 overflow-y-auto border border-gray-200 rounded-lg p-2"
                      style={{ scrollBehavior: "smooth" }}
                    >
                      {mapCoordinates.map((coord, index) => (
                        <div
                          key={index}
                          id={`point-${index}`}
                          className={`flex items-center justify-between text-sm p-2 rounded cursor-pointer transition-all ${
                            selectedPointIndex === index
                              ? "bg-yellow-100 border-2 border-yellow-400 shadow-md"
                              : "bg-gray-50 hover:bg-gray-100 border border-gray-200"
                          }`}
                          onClick={() => handlePointSelect(index)}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              handlePointSelect(index);
                            }
                          }}
                        >
                          <span
                            className="text-gray-800 flex-1 select-none"
                            style={{ pointerEvents: "none" }}
                          >
                            {coord.label}: {coord.lat.toFixed(6)},{" "}
                            {coord.lng.toFixed(6)}
                            {selectedPointIndex === index && !insertMode && (
                              <span className="ml-2 text-yellow-600 font-medium">
                                (Click map to move)
                              </span>
                            )}
                            {selectedPointIndex === index && insertMode && (
                              <span className="ml-2 text-green-600 font-medium">
                                (Click map to add after)
                              </span>
                            )}
                          </span>
                          <div className="flex gap-1">
                            {selectedPointIndex === index && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setInsertMode(!insertMode);
                                }}
                                className={`px-2 py-1 text-xs font-medium rounded ${
                                  insertMode
                                    ? "bg-green-500 text-white hover:bg-green-600"
                                    : "bg-blue-500 text-white hover:bg-blue-600"
                                }`}
                                title={
                                  insertMode
                                    ? "Exit insert mode"
                                    : "Insert point after this"
                                }
                              >
                                {insertMode ? "Cancel" : "Insert"}
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                removeMapCoordinate(index);
                                if (selectedPointIndex === index) {
                                  setInsertMode(false);
                                }
                              }}
                              className="text-red-600 hover:text-red-800 font-medium px-2 py-1"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      ))}
                      {mapCoordinates.length === 0 && (
                        <p className="text-gray-500 text-sm text-center py-4">
                          Click on the map to add points
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-4">
                  <button
                    type="button"
                    onClick={() => setShowCloseLoopModal(true)}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      mapCoordinates.length < 2
                        ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                        : mapCoordinates.length > 2 &&
                          mapCoordinates[mapCoordinates.length - 1].lat ===
                            mapCoordinates[0].lat &&
                          mapCoordinates[mapCoordinates.length - 1].lng ===
                            mapCoordinates[0].lng
                        ? "bg-green-500 text-white cursor-not-allowed"
                        : "bg-[#FFCC66] text-black hover:bg-[#CC9933]"
                    }`}
                    disabled={
                      mapCoordinates.length < 2 ||
                      (mapCoordinates.length > 2 &&
                        mapCoordinates[mapCoordinates.length - 1].lat ===
                          mapCoordinates[0].lat &&
                        mapCoordinates[mapCoordinates.length - 1].lng ===
                          mapCoordinates[0].lng)
                    }
                    title={
                      mapCoordinates.length < 2
                        ? "Need at least 2 points to close loop"
                        : ""
                    }
                  >
                    {mapCoordinates.length > 2 &&
                    mapCoordinates[mapCoordinates.length - 1].lat ===
                      mapCoordinates[0].lat &&
                    mapCoordinates[mapCoordinates.length - 1].lng ===
                      mapCoordinates[0].lng
                      ? "✓ Loop Closed"
                      : "Close Loop"}
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`flex-1 py-2 px-4 rounded-lg font-medium text-white transition-colors ${
                      isSubmitting
                        ? "bg-gray-400 cursor-not-allowed"
                        : "bg-blue-500 hover:bg-blue-600"
                    }`}
                  >
                    {isSubmitting ? "Adding..." : "Add Route"}
                  </button>
                </div>

                {/* Status Message */}
                {status.message && (
                  <div
                    className={`p-4 rounded-lg ${
                      status.type === "error"
                        ? "bg-red-100 text-red-700"
                        : "bg-green-100 text-green-700"
                    }`}
                  >
                    {status.message}
                  </div>
                )}
              </form>
            </div>

            {/* Map Section - Route Preview */}
            <div className="p-2">
              <div className="flex item-between space-x-5 mb-2">
                <h2 className="text-xl font-bold text-gray-200">
                  ROUTE PREVIEW
                </h2>
                <p className="text-sm text-gray-400 mt-1">
                  Click on the map to add/edit route points
                </p>
              </div>
              <div className="space-y-6 border-2 border-[#CC9933] rounded-lg p-4">
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-4">
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={showPointNumbers}
                        onChange={(e) => setShowPointNumbers(e.target.checked)}
                        className="sr-only"
                      />
                      <div className="relative">
                        <div
                          className={`block w-10 h-6 rounded-full ${
                            showPointNumbers ? "bg-blue-600" : "bg-gray-300"
                          }`}
                        ></div>
                        <div
                          className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition ${
                            showPointNumbers ? "transform translate-x-4" : ""
                          }`}
                        ></div>
                      </div>
                      <span className="ml-2 text-sm font-medium text-white">
                        Numbers
                      </span>
                    </label>
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={hidePOIs}
                        onChange={(e) => setHidePOIs(e.target.checked)}
                        className="sr-only"
                      />
                      <div className="relative">
                        <div
                          className={`block w-10 h-6 rounded-full ${
                            hidePOIs ? "bg-blue-600" : "bg-gray-300"
                          }`}
                        ></div>
                        <div
                          className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition ${
                            hidePOIs ? "transform translate-x-4" : ""
                          }`}
                        ></div>
                      </div>
                      <span className="ml-2 text-sm font-medium text-white">
                        Hide Places
                      </span>
                    </label>
                  </div>
                </div>

                {/* Edit Mode Indicator */}
                {selectedPointIndex !== null && (
                  <div className="mb-4 p-3 bg-yellow-50 border border-yellow-300 rounded-lg flex items-center">
                    <svg
                      className="w-5 h-5 text-yellow-600 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                      />
                    </svg>
                    <span className="text-yellow-800 font-medium">
                      Editing Point {selectedPointIndex + 1} - Click on the map
                      to move this point
                    </span>
                  </div>
                )}

                <AddRouteMap
                  coordinates={getDisplayCoordinates()}
                  onMapClick={handleMapClick}
                  enableClickToAdd={true}
                  height="500px"
                  highlightedIndex={selectedPointIndex}
                  onPointClick={handlePointSelect}
                  onSegmentClick={handleSegmentClick}
                  showPointNumbers={showPointNumbers}
                  hidePOIs={hidePOIs}
                />

                {/* Map Instructions */}
                <div className="mt-2 space-y-3">
                  {/* Legend */}
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-2 text-sm">
                      Map Legend
                    </h4>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center text-white font-bold text-[10px]">
                          ✕
                        </div>
                        <span className="text-gray-700">Start Point</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center text-white font-bold text-[10px]">
                          O
                        </div>
                        <span className="text-gray-700">End Point</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-[10px]">
                          •
                        </div>
                        <span className="text-gray-700">Waypoints</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-5 h-1 rounded"
                          style={{ backgroundColor: "#FF6B6B" }}
                        ></div>
                        <span className="text-gray-700">Route Path</span>
                      </div>
                    </div>
                  </div>

                  {/* Instructions */}
                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <h4 className="font-semibold text-blue-900 mb-2 text-sm flex items-center">
                      <svg
                        className="w-4 h-4 mr-1"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      How to Map a Route
                    </h4>
                    <div className="space-y-2 text-xs text-blue-800">
                      <div>
                        <p className="font-semibold mb-1">Adding Points:</p>
                        <ul className="ml-3 space-y-0.5">
                          <li>• Click anywhere on map → Add waypoint at end</li>
                          <li>• Click on blue line → Insert between points</li>
                          <li>• Minimum 2 points required</li>
                        </ul>
                      </div>
                      <div>
                        <p className="font-semibold mb-1">Editing Points:</p>
                        <ul className="ml-3 space-y-0.5">
                          <li>• Select point from list → Click map to move</li>
                          <li>
                            • Click &quot;Insert&quot; button → Add point after
                            selected
                          </li>
                          <li>• Click &quot;✕&quot; button → Remove point</li>
                        </ul>
                      </div>
                      <div>
                        <p className="font-semibold mb-1">Final Step:</p>
                        <ul className="ml-3 space-y-0.5">
                          <li>
                            • After placing all pins → Click &quot;Close
                            Loop&quot; button
                          </li>
                          <li>• This connects the end point back to start</li>
                        </ul>
                      </div>
                      <div className="mt-2 p-2 bg-yellow-50 rounded border border-yellow-300">
                        <p className="text-yellow-800 font-semibold">
                          ⚠️ Important: Pin order defines travel direction!
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : activeTab === "list" ? (
          <RoutesList />
        ) : activeTab === "review" ? (
          <div className="gap-3 p-3">
            <div className="p-2">
              <h2 className="text-xl font-bold text-gray-200 mb-2">
                PENDING ROUTE CONTRIBUTIONS
              </h2>

              {loadingContributions ? (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <p className="mt-2 text-gray-600">Loading contributions...</p>
                </div>
              ) : contributions.filter((c) => c.status === "pending").length ===
                0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-400">
                    No pending contributions to review
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {contributions
                    .filter((c) => c.status === "pending")
                    .map((contribution) => {
                      const isReviewing =
                        selectedContribution?.id === contribution.id;
                      const isEditing =
                        isReviewing &&
                        editingContributionId === contribution.id;

                      return (
                        <div
                          key={contribution.id}
                          className="border-[#CC9933] border-2 rounded-lg p-4"
                        >
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <h3 className="text-lg font-semibold text-white">
                                Route {contribution.route_code}
                              </h3>
                              <p className="text-sm text-gray-400">
                                Contributed by: {contribution.contributor_name}
                                {contribution.contributor_email &&
                                  ` (${contribution.contributor_email})`}
                              </p>
                              <p className="text-xs text-gray-400">
                                Submitted:{" "}
                                {new Date(
                                  contribution.created_at
                                ).toLocaleString()}
                              </p>
                            </div>
                            <div className="flex gap-2">
                              {!isReviewing ? (
                                <button
                                  onClick={() => {
                                    setSelectedContribution(contribution);
                                    setEditingContributionId(null);
                                    setContributionCoordinates(
                                      contribution.forward_geojson?.coordinates?.map(
                                        (
                                          coord: [number, number],
                                          index: number
                                        ) => ({
                                          lat: coord[1],
                                          lng: coord[0],
                                          label: `Point ${index + 1}`,
                                        })
                                      ) || []
                                    );
                                    setReviewAction(null);
                                  }}
                                  className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
                                >
                                  Review
                                </button>
                              ) : (
                                <>
                                  {!isEditing && (
                                    <button
                                      onClick={() =>
                                        setEditingContributionId(
                                          contribution.id
                                        )
                                      }
                                      className="px-3 py-1 text-sm bg-[#FFCC66] text-white rounded hover:bg-[#CC9933]"
                                    >
                                      Edit
                                    </button>
                                  )}
                                  {isEditing && (
                                    <button
                                      onClick={() =>
                                        setEditingContributionId(null)
                                      }
                                      className="px-3 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600"
                                    >
                                      Done Editing
                                    </button>
                                  )}
                                  <button
                                    onClick={() => {
                                      setSelectedContribution(null);
                                      setEditingContributionId(null);
                                      setContributionCoordinates([]);
                                    }}
                                    className="px-3 py-1 text-sm bg-gray-500 text-white rounded hover:bg-gray-600"
                                  >
                                    Close
                                  </button>
                                </>
                              )}
                            </div>
                          </div>

                          {/* Show review details if selected */}
                          {isReviewing && (
                            <div className="mt-4 border-t pt-4">
                              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                {/* Left side - Details and Controls */}
                                <div className="space-y-4">
                                  <div className="p-4 rounded-lg">
                                    <h4 className="font-semibold mb-3 text-lg">
                                      Route Details
                                    </h4>
                                    <div className="space-y-3">
                                      <div className="text-sm space-y-2">
                                        <p className="flex justify-between">
                                          <strong>Route Code:</strong>
                                          <span className="text-blue-600 font-medium">
                                            {contribution.route_code}
                                          </span>
                                        </p>
                                        <p className="flex justify-between">
                                          <strong>Total Points:</strong>
                                          <span>
                                            {contributionCoordinates.length}
                                          </span>
                                        </p>
                                        <p className="flex justify-between">
                                          <strong>Route Type:</strong>
                                          <span>
                                            {contribution.forward_geojson.type}
                                          </span>
                                        </p>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Editing Controls */}
                                  {isEditing && (
                                    <div className="bg-white p-4 rounded-lg border">
                                      <h4 className="font-semibold mb-3">
                                        Edit Route Points
                                      </h4>
                                      <div className="h-64 overflow-y-auto border border-gray-200 rounded-lg p-2 space-y-2">
                                        {contributionCoordinates.map(
                                          (coord, index) => (
                                            <div
                                              key={index}
                                              className={`flex items-center justify-between text-sm p-2 rounded cursor-pointer transition-all ${
                                                selectedContribPointIndex ===
                                                index
                                                  ? "bg-yellow-100 border-2 border-yellow-400 shadow-md"
                                                  : "bg-gray-50 hover:bg-gray-100 border border-gray-200"
                                              }`}
                                              onClick={() =>
                                                setSelectedContribPointIndex(
                                                  index
                                                )
                                              }
                                            >
                                              <span className="text-gray-800 flex-1">
                                                {coord.label}:{" "}
                                                {coord.lat.toFixed(6)},{" "}
                                                {coord.lng.toFixed(6)}
                                              </span>
                                              <button
                                                type="button"
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  const newCoords =
                                                    contributionCoordinates.filter(
                                                      (_, i) => i !== index
                                                    );
                                                  setContributionCoordinates(
                                                    newCoords
                                                  );
                                                }}
                                                className="text-red-500 hover:text-red-700 px-2"
                                              >
                                                ✕
                                              </button>
                                            </div>
                                          )
                                        )}
                                      </div>
                                      {contributionCoordinates.length === 0 && (
                                        <p className="text-gray-500 text-sm mt-2">
                                          Click on the map to add route points
                                        </p>
                                      )}
                                    </div>
                                  )}

                                  {/* Action Buttons */}
                                  {!reviewAction && (
                                    <div className="flex gap-2">
                                      <button
                                        onClick={() =>
                                          setReviewAction("approve")
                                        }
                                        className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                                      >
                                        Approve
                                      </button>
                                      <button
                                        onClick={() =>
                                          setReviewAction("reject")
                                        }
                                        className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                                      >
                                        Reject
                                      </button>
                                    </div>
                                  )}

                                  {reviewAction && (
                                    <div className="bg-white p-4 rounded-lg border">
                                      <label className="block text-sm font-semibold mb-1">
                                        Review Notes:
                                      </label>
                                      <textarea
                                        value={reviewNotes}
                                        onChange={(e) =>
                                          setReviewNotes(e.target.value)
                                        }
                                        className="w-full px-3 py-2 border rounded text-sm"
                                        rows={3}
                                        placeholder={
                                          reviewAction === "approve"
                                            ? "Optional approval notes..."
                                            : "Please provide rejection reason..."
                                        }
                                        required={reviewAction === "reject"}
                                      />
                                      <div className="flex gap-2 mt-2">
                                        <button
                                          onClick={() => {
                                            // Update contribution with edited coordinates before approval
                                            const updatedContribution = {
                                              ...contribution,
                                              forward_geojson: {
                                                ...contribution.forward_geojson,
                                                coordinates:
                                                  contributionCoordinates.map(
                                                    (coord) =>
                                                      [
                                                        coord.lng,
                                                        coord.lat,
                                                      ] as [number, number]
                                                  ),
                                              },
                                            };
                                            if (reviewAction === "approve") {
                                              handleApproveContribution(
                                                updatedContribution
                                              );
                                            } else {
                                              handleRejectContribution(
                                                updatedContribution
                                              );
                                            }
                                          }}
                                          className={`px-4 py-2 text-white rounded ${
                                            reviewAction === "approve"
                                              ? "bg-green-500 hover:bg-green-600"
                                              : "bg-red-500 hover:bg-red-600"
                                          }`}
                                        >
                                          Confirm{" "}
                                          {reviewAction === "approve"
                                            ? "Approval"
                                            : "Rejection"}
                                        </button>
                                        <button
                                          onClick={() => {
                                            setReviewAction(null);
                                            setReviewNotes("");
                                          }}
                                          className="px-4 py-2 bg-gray-400 text-white rounded hover:bg-gray-500"
                                        >
                                          Cancel
                                        </button>
                                      </div>
                                    </div>
                                  )}
                                </div>

                                {/* Right side - Map */}
                                <div className="bg-gray-50 p-4 rounded-lg">
                                  <h4 className="font-semibold mb-3 text-lg flex items-center">
                                    <svg
                                      className="w-5 h-5 mr-2 text-blue-600"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                                      />
                                    </svg>
                                    Route Preview {isEditing && "(Editing)"}
                                  </h4>
                                  <div className="h-96 border-2 border-blue-200 rounded-lg overflow-hidden">
                                    <AddRouteMap
                                      coordinates={contributionCoordinates.map(
                                        (coord) =>
                                          [coord.lng, coord.lat] as [
                                            number,
                                            number
                                          ]
                                      )}
                                      height="384px"
                                      enableClickToAdd={isEditing}
                                      showPointNumbers={true}
                                      hidePOIs={false}
                                      highlightedIndex={
                                        isEditing
                                          ? selectedContribPointIndex
                                          : null
                                      }
                                      onMapClick={
                                        isEditing
                                          ? (lat: number, lng: number) => {
                                              if (
                                                selectedContribPointIndex !==
                                                null
                                              ) {
                                                // Update existing point
                                                const newCoords = [
                                                  ...contributionCoordinates,
                                                ];
                                                newCoords[
                                                  selectedContribPointIndex
                                                ] = {
                                                  ...newCoords[
                                                    selectedContribPointIndex
                                                  ],
                                                  lat,
                                                  lng,
                                                };
                                                setContributionCoordinates(
                                                  newCoords
                                                );
                                                setSelectedContribPointIndex(
                                                  null
                                                );
                                              } else {
                                                // Add new point
                                                const newPoint = {
                                                  lat,
                                                  lng,
                                                  label: `Point ${
                                                    contributionCoordinates.length +
                                                    1
                                                  }`,
                                                };
                                                setContributionCoordinates([
                                                  ...contributionCoordinates,
                                                  newPoint,
                                                ]);
                                              }
                                            }
                                          : undefined
                                      }
                                      onPointClick={
                                        isEditing
                                          ? (index: number) => {
                                              setSelectedContribPointIndex(
                                                index
                                              );
                                            }
                                          : undefined
                                      }
                                      onSegmentClick={
                                        isEditing
                                          ? (
                                              afterIndex: number,
                                              lat: number,
                                              lng: number
                                            ) => {
                                              const newPoint = {
                                                lat,
                                                lng,
                                                label: `Point ${
                                                  afterIndex + 2
                                                }`,
                                              };
                                              const newCoords = [
                                                ...contributionCoordinates,
                                              ];
                                              newCoords.splice(
                                                afterIndex + 1,
                                                0,
                                                newPoint
                                              );
                                              // Update labels
                                              newCoords.forEach((coord, i) => {
                                                coord.label = `Point ${i + 1}`;
                                              });
                                              setContributionCoordinates(
                                                newCoords
                                              );
                                            }
                                          : undefined
                                      }
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          </div>
        ) : null}
      </div>

      {/* Close Loop Confirmation Modal */}
      <ConfirmModal
        isOpen={showCloseLoopModal}
        onClose={() => setShowCloseLoopModal(false)}
        onConfirm={() => {
          const firstPoint = mapCoordinates[0];
          const lastIndex = mapCoordinates.length;
          const closingPoint = {
            ...firstPoint,
            label: `Point ${lastIndex + 1} (Loop Close)`,
          };
          setMapCoordinates([...mapCoordinates, closingPoint]);
        }}
        title="⚠️ Closing the Loop"
        message={`Once you close the loop:
• You can only add points between existing segments
• You cannot add points at the end of the route
• The route will form a continuous loop

Are you sure you want to close the loop?`}
        confirmText="Yes, Close Loop"
        cancelText="Cancel"
        confirmButtonClass="bg-purple-600 hover:bg-purple-700"
      />
    </div>
  );
}
