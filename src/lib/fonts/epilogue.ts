// Epilogue is the essay font (.tier-essay scope). Only /self and /dad
// use it, so this side-effect-only module is imported from those routes
// instead of the global layout — keeps the other 7 routes from
// shipping the 3 weight files.
import '@fontsource/epilogue/400.css';
import '@fontsource/epilogue/500.css';
import '@fontsource/epilogue/700.css';
