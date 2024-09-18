import React, { useState, useEffect, useRef } from "react";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import { CssBaseline, Container, Grid, Paper, Switch, Typography, IconButton, Button, TextField } from "@mui/material";
import UndoIcon from "@mui/icons-material/Undo";
import ContentCopyIcon from '@mui/icons-material/ContentCopy';

import BuilderSelect from "./components/BuilderSelect";
import CommunitySelect from "./components/CommunitySelect";
import FloorPlanSelect from "./components/FloorPlanSelect";
import OptionsSelect from "./components/OptionsSelect";
import TakeoffOutput from "./components/TakeoffOutput";
import TrimModelSelector from "./components/TrimModelSelector";

import { fetchBuilders, fetchCommunities, fetchFloorPlansAndOptions } from './utils/dataFetchers';
import { calculateTakeoff } from './utils/takeoffCalculations';
import {
  handleBuilderSelect,
  handleCommunitySelect,
  handleFloorPlanSelect,
  handleOptionsSelect,
  moveItem,
  removeItem,
  undoLastAction,
  addCustomItem
} from './utils/stateHandlers';
import { copyToClipboard } from './utils/uiHelpers';

const App = () => {
  const [darkMode, setDarkMode] = useState(false);
  const [builders, setBuilders] = useState([]);
  const [communities, setCommunities] = useState([]);
  const [floorPlans, setFloorPlans] = useState([]);
  const [options, setOptions] = useState({});
  const [selectedBuilder, setSelectedBuilder] = useState(null);
  const [selectedCommunity, setSelectedCommunity] = useState(null);
  const [selectedFloorPlan, setSelectedFloorPlan] = useState(null);
  const [selectedOptions, setSelectedOptions] = useState([]);
  const [takeoffOutput, setTakeoffOutput] = useState([]);
  const [takeoffHistory, setTakeoffHistory] = useState([]);
  const [trims, setTrims] = useState({});
  const [trimTakeoff, setTrimTakeoff] = useState([]);
  const [trimHistory, setTrimHistory] = useState([]);
  const [kitchenFaucetModel, setKitchenFaucetModel] = useState('Kitchen Faucet');
  const [selectedTrimModels, setSelectedTrimModels] = useState(null);
  const customItemRef = useRef(null);
  const customTrimItemRef = useRef(null);

  const kitchenFaucetModels = [
    'Kitchen Faucet', '7594C', '7594SRS', '7594BL', '7594ORB', '7185C', '7185SRS', '7185ORB',
    '7565', '7565SRS', '7565BL', '7565BG', '5923', '5923SRS', '5923BL', '5923BG',
    'S72308', 'S72308SRS', 'S72308BL', 'S72308BG', '7295C', '7295SRS', '7295ORB',
    '7864', '7864SRS', '7864BL', '7864ORB', '7082', '67315C', '67315SRS'
  ];

  const theme = createTheme({ palette: { mode: darkMode ? "dark" : "light" } });

  useEffect(() => { fetchBuilders(setBuilders); }, []);
  useEffect(() => { if (selectedBuilder) fetchCommunities(selectedBuilder, setCommunities); }, [selectedBuilder]);
  useEffect(() => {
    if (selectedBuilder && selectedCommunity) {
      fetchFloorPlansAndOptions(selectedBuilder, selectedCommunity, setFloorPlans, setOptions, setTrims);
    }
  }, [selectedBuilder, selectedCommunity]);

  useEffect(() => {
    if (floorPlans.length > 0) setSelectedFloorPlan(floorPlans[0]);
    else setSelectedFloorPlan(null);
  }, [floorPlans]);

  useEffect(() => {
    if (selectedFloorPlan && selectedCommunity) {
      console.log('In useEffect for takeoff calculation', {
        selectedFloorPlan,
        selectedOptions,
        options,
        trims,
        selectedCommunity,
        kitchenFaucetModel,
        selectedTrimModels,
      });
      const result = calculateTakeoff(
        selectedFloorPlan,
        selectedOptions,
        options,
        trims,
        selectedCommunity,
        kitchenFaucetModel,
        selectedTrimModels
      );

      if (result.takeoffOutput && result.trimTakeoff) {
        setTakeoffHistory((prev) => [...prev, takeoffOutput]);
        setTakeoffOutput(result.takeoffOutput);
        setTrimHistory((prev) => [...prev, trimTakeoff]);
        setTrimTakeoff(result.trimTakeoff);

        // Update kitchen faucet model from trim takeoff
        const kitchenFaucetItem = result.trimTakeoff.find(item => item.toLowerCase().includes('kitchen faucet'));
        if (kitchenFaucetItem) {
          const [, model] = kitchenFaucetItem.split(' - ');
          setKitchenFaucetModel(model);
        }
      } else {
        console.error('Invalid takeoff result:', result);
      }
    } else {
      setTakeoffOutput([]);
      setTrimTakeoff([]);
    }
  }, [selectedFloorPlan, selectedOptions, options, trims, selectedCommunity, selectedTrimModels]);

  const handleOptions = (options) => {
    setSelectedOptions(options);
  };

  const handleTrimModelSelect = (models) => {
    console.log('Selected trim models:', models);
    setSelectedTrimModels(models);

    // Update trimTakeoff based on selected models
    const newTrimTakeoff = Object.entries(models)
      .filter(([key]) => key !== 'brand' && key !== 'series' && key !== 'finish')
      .map(([fixture, modelNumber]) => `1 - ${modelNumber} - ${fixture}`);

    setTrimTakeoff(newTrimTakeoff);
  };

  const handleKitchenFaucetModelChange = (newModel, index, setFunction) => {
    setFunction((prev) => {
      const updatedOutput = [...prev];
      const [quantity] = updatedOutput[index].split(' - ');
      updatedOutput[index] = `${quantity} - ${newModel}`;
      return updatedOutput;
    });
    setKitchenFaucetModel(newModel);
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Container maxWidth="lg">
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Paper style={{ padding: "1rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center" }}>
                <Typography variant="h4" style={{ marginRight: "1rem" }}>Plumbing Takeoff Application</Typography>
                <Switch checked={darkMode} onChange={() => setDarkMode(!darkMode)} name="darkMode" color="primary" />
                <Typography>Dark Mode</Typography>
              </div>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={3}>
            <BuilderSelect builders={builders} selectedBuilder={selectedBuilder} onSelect={(builder) => handleBuilderSelect(builder, setSelectedBuilder, setSelectedCommunity, setSelectedFloorPlan, setSelectedOptions)} />
          </Grid>
          <Grid item xs={12} sm={3}>
            <CommunitySelect communities={communities.filter((c) => c.builder_id === selectedBuilder?.id)} selectedCommunity={selectedCommunity} onSelect={(community) => handleCommunitySelect(community, setSelectedCommunity, setSelectedFloorPlan, setSelectedOptions)} />
          </Grid>
          <Grid item xs={12} sm={3}>
            <FloorPlanSelect floorPlans={floorPlans} selectedFloorPlan={selectedFloorPlan} onSelect={(floorPlan) => handleFloorPlanSelect(floorPlan, setSelectedFloorPlan, setSelectedOptions)} />
          </Grid>
          <Grid item xs={12} sm={3}>
            <OptionsSelect options={selectedFloorPlan && options[selectedFloorPlan.name] ? Object.keys(options[selectedFloorPlan.name] || {}) : []} selectedOptions={selectedOptions} onSelect={handleOptions} />
          </Grid>
          <Grid item xs={12}>
            <Paper style={{ padding: "1rem" }}>
              <Typography variant="h6">Takeoff Output</Typography>
              <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "1rem" }}>
                <IconButton onClick={() => undoLastAction(false, setTakeoffOutput, setTakeoffHistory)} disabled={takeoffHistory.length === 0} size="small"><UndoIcon /></IconButton>
                <IconButton onClick={() => copyToClipboard(false, trimTakeoff, takeoffOutput)} size="small"><ContentCopyIcon /></IconButton>
              </div>
              <TakeoffOutput output={takeoffOutput} removeItem={(index) => removeItem(index, false, setTakeoffOutput, setTakeoffHistory, takeoffOutput)} moveItem={(fromIndex, toIndex) => moveItem(fromIndex, toIndex, false, setTakeoffOutput)} kitchenFaucetModels={kitchenFaucetModels} onKitchenFaucetModelChange={(newModel, index) => handleKitchenFaucetModelChange(newModel, index, setTakeoffOutput)} isTrim={false} />
              <div style={{ display: "flex", marginTop: "1rem" }}>
                <TextField inputRef={customItemRef} label="Custom Item" fullWidth />
                <Button onClick={() => addCustomItem(false, customItemRef, customTrimItemRef, setTakeoffOutput, setTakeoffHistory, takeoffOutput)} variant="contained" color="primary" style={{ marginLeft: "1rem" }}>Add</Button>
              </div>
            </Paper>
          </Grid>
          <Grid item xs={12}>
            <Paper style={{ padding: "1rem" }}>
              <Typography variant="h6">Trim Takeoff Output</Typography>
              <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "1rem" }}>
                <IconButton onClick={() => undoLastAction(true, setTrimTakeoff, setTrimHistory)} disabled={trimHistory.length === 0} size="small"><UndoIcon /></IconButton>
                <IconButton onClick={() => copyToClipboard(true, trimTakeoff, takeoffOutput)} size="small"><ContentCopyIcon /></IconButton>
              </div>
              <TakeoffOutput output={trimTakeoff} removeItem={(index) => removeItem(index, true, setTrimTakeoff, setTrimHistory, trimTakeoff)} moveItem={(fromIndex, toIndex) => moveItem(fromIndex, toIndex, true, setTrimTakeoff)} kitchenFaucetModels={kitchenFaucetModels} onKitchenFaucetModelChange={(newModel, index) => handleKitchenFaucetModelChange(newModel, index, setTrimTakeoff)} isTrim={true} />
              <div style={{ display: "flex", marginTop: "1rem" }}>
                <TextField inputRef={customTrimItemRef} label="Custom Trim Item" fullWidth />
                <Button onClick={() => addCustomItem(true, customItemRef, customTrimItemRef, setTrimTakeoff, setTrimHistory, trimTakeoff)} variant="contained" color="primary" style={{ marginLeft: "1rem" }}>Add</Button>
              </div>
              <Typography variant="h6" style={{ marginTop: "1rem" }}>Trim Model Selection</Typography>
              <TrimModelSelector brand="Moen" onModelSelect={handleTrimModelSelect} />
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </ThemeProvider>
  );
}

export default App;
