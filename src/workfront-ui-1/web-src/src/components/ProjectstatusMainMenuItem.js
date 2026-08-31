/*
 * <license header>
 */

import GatingDashboard from './dashboard/GatingDashboard';
import { sampleProject } from '../data/sampleProject';

/**
 * Project Status route. For now it renders the gating dashboard from mock data;
 * once the Workfront/API layer is available, fetch the payload here and pass it
 * in place of `sampleProject` (same shape).
 */
const ProjectstatusMainMenuItem = () => {
  return <GatingDashboard project={sampleProject} />;
};

export default ProjectstatusMainMenuItem;
