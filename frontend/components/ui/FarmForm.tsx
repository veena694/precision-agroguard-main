import { useState } from "react"

export default function FarmForm() {

  const [farmerName, setFarmerName] = useState("")
  const [farmName, setFarmName] = useState("")
  const [location, setLocation] = useState("")
  const [size, setSize] = useState("")
  const [errors, setErrors] = useState<any>({})

  const validate = () => {

    let newErrors: any = {}

    if (!farmerName.trim()) {
      newErrors.farmerName = "Farmer Name is required"
    }

    if (!farmName.trim()) {
      newErrors.farmName = "Farm Name is required"
    }

    if (!location.trim()) {
      newErrors.location = "Location is required"
    }

    if (!size.trim()) {
      newErrors.size = "Farm Size is required"
    }

    setErrors(newErrors)

    return Object.keys(newErrors).length === 0
  }

  const createFarm = async () => {

    if (!validate()) return

    const response = await fetch("/api/farms", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        farmer_name: farmerName,
        farm_name: farmName,
        location: location,
        farm_size: size
      })
    })

    const data = await response.json()

    console.log(data)
    alert("Farm Created")

    // clear form
    setFarmerName("")
    setFarmName("")
    setLocation("")
    setSize("")
    setErrors({})
  }

  return (
    <div className="space-y-4 max-w-md">

      <h2 className="text-xl font-semibold">Create Farm</h2>

      {/* Farmer Name */}
      <div>
        <input
          placeholder="Farmer Name"
          value={farmerName}
          onChange={(e)=>setFarmerName(e.target.value)}
          className="border p-2 w-full rounded"
        />
        {errors.farmerName && (
          <p className="text-red-500 text-sm">{errors.farmerName}</p>
        )}
      </div>

      {/* Farm Name */}
      <div>
        <input
          placeholder="Farm Name"
          value={farmName}
          onChange={(e)=>setFarmName(e.target.value)}
          className="border p-2 w-full rounded"
        />
        {errors.farmName && (
          <p className="text-red-500 text-sm">{errors.farmName}</p>
        )}
      </div>

      {/* Location */}
      <div>
        <input
          placeholder="Location"
          value={location}
          onChange={(e)=>setLocation(e.target.value)}
          className="border p-2 w-full rounded"
        />
        {errors.location && (
          <p className="text-red-500 text-sm">{errors.location}</p>
        )}
      </div>

      {/* Farm Size */}
      <div>
        <input
          placeholder="Farm Size"
          value={size}
          onChange={(e)=>setSize(e.target.value)}
          className="border p-2 w-full rounded"
        />
        {errors.size && (
          <p className="text-red-500 text-sm">{errors.size}</p>
        )}
      </div>

      <button
        onClick={createFarm}
        className="bg-green-500 text-white px-4 py-2 rounded mt-2 w-full"
      >
        Create Farm
      </button>

    </div>
  )
}