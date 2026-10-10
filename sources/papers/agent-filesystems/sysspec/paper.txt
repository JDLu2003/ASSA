                                         Sharpen the Spec, Cut the Code: A Case for Generative File System with S YS S PEC

                                                         Qingyuan Liu, Mo Zou, Hengbin Zhang, Dong Du, Yubin Xia, Haibo Chen
                                                                                    Institute of Parallel and Distributed Systems
                                                                                           Shanghai Jiao Tong University

                                                                  Abstract                                   memory [29] and EROFS for read-only mobile scenarios [22].
                                                                                                             Consequently, file system developers are in a perpetual cycle
                                            File systems are critical OS components that require con-
                                                                                                             of adding features, optimizing performance, and resolving
                                         stant evolution to support new hardware and emerging applica-
                                                                                                             bugs to keep pace with innovation.
arXiv:2512.13047v4 [cs.OS] 10 Feb 2026




                                         tion needs. However, the traditional paradigm of developing
                                                                                                                However, this evolution comes at a steep price. To quantify
                                         features, fixing bugs, and maintaining the system incurs sig-
                                                                                                             this challenge, we conduct a longitudinal study of the Ext4
                                         nificant overhead, especially as systems grow in complexity.
                                                                                                             file system’s development, analyzing all 3,157 commits from
                                         This paper proposes a new paradigm, generative file systems,
                                                                                                             its inception in Linux 2.6.19 to the recent 6.15 release. Our
                                         which leverages Large Language Models (LLMs) to generate
                                                                                                             analysis reveals that 82.4% of all commits are dedicated to
                                         and evolve a file system from prompts, effectively addressing
                                                                                                             bug fixes and maintenance, which are a direct consequence of
                                         the need for robust evolution. Despite the widespread success
                                                                                                             introducing new functionality (which accounts for only 5.1%
                                         of LLMs in code generation, attempts to create a functional
                                                                                                             of total commits). E.g., the recently merged “fast commits”
                                         file system have thus far been unsuccessful, mainly due to the
                                                                                                             feature [41] required only 9 commits for its initial implemen-
                                         ambiguity of natural language prompts.
                                                                                                             tation, while it triggered about 80 subsequent commits to
                                            This paper introduces S YS S PEC, a framework for devel-
                                                                                                             address newly introduced bugs and maintain the code (§2.2).
                                         oping generative file systems. Its key insight is to replace
                                                                                                             This demonstrates a common development cycle where the
                                         ambiguous natural language with principles adapted from
                                                                                                             effort to stabilize new features far outweighs the initial imple-
                                         formal methods. Instead of imprecise prompts, S YS S PEC
                                                                                                             mentation effort, placing a non-trivial burden on developers.
                                         employs a multi-part specification that accurately describes a
                                                                                                                This motivates us to explore a new paradigm for file
                                         file system’s functionality, modularity, and concurrency. The
                                                                                                             system design and development, generative file systems,
                                         specification acts as an unambiguous blueprint, guiding LLMs
                                                                                                             which leverages the capabilities of Large Language Models
                                         to generate expected code flexibly. To manage evolution, we
                                                                                                             (LLMs) [1, 11, 33, 34, 48] to generate a complete file system
                                         develop a DAG-structured patch that operates on the specifica-
                                                                                                             and evolve it effectively.
                                         tion itself, enabling new features to be added without violating
                                         existing invariants. Moreover, the S YS S PEC toolchain fea-           Nevertheless, although recent advancements in LLMs have
                                         tures a set of LLM-based agents with mechanisms to mitigate         demonstrated their profound capabilities in automated code
                                         hallucination during construction and evolution. We demon-          generation [2, 3, 20, 24, 25, 49, 53, 54], generating a complete
                                         strate our approach by generating S PEC FS, a concurrent file       and useful file system from natural-language prompts is pro-
                                         system. S PEC FS demonstrates equivalent level of correct-          foundly challenging, if not impossible. The intricate seman-
                                         ness to that of a manually-coded baseline across hundreds           tics of file systems, from ensuring concurrency correctness
                                         of regression tests. We further confirm its evolvability by         to carefully managing complex file structures, are difficult
                                         seamlessly integrating 10 real-world features from Ext4. Our        to express unambiguously in prompts. Consequently, to our
                                         work shows that a specification-guided approach makes gen-          knowledge, no prior LLM-based approach has successfully
                                         erating and evolving complex systems not only feasible but          generated a complete, functional, and feature-rich file system.
                                         also highly effective.                                                 Compared with descriptions with natural language, spec-
                                                                                                             ifications [38, 45] usually provide a precise and machine-
                                                                                                             understandable language to explicitly encode these invariants
                                         1   Introduction                                                    (e.g., no orphan inodes after a crash), creating an opportunity
                                                                                                             to guide LLMs toward generating expected code. However,
                                         File systems are a cornerstone of modern operating systems,         bridging the gap between specifications and LLM-based code
                                         providing the critical abstractions for managing persistent         generation is non-trivial. We identify three technical chal-
                                         data. Their design is dictated by a symbiotic relationship          lenges that our work, S YS S PEC, is designed to overcome:
                                         with two forces: the characteristics of underlying storage          Challenge I: Specification semantic gap. A specification
                                         hardware and the demands of ever-changing applications.             must be expressive enough to capture the multifaceted se-
                                         This relationship necessitates continuous evolution, driving        mantics of a file system, which natural language prompts
                                         the creation of specialized file systems like F2FS for flash        fail to do. This includes not only functional correctness but
                                                           5.1% 5.5%
                                47.2%            35.2%       6.9% Commit                                                        Performance
                  175                                              Count
                                                                                                                                Feature
                  150   19.4%           50.3%            18.4% 7.1% LOC                                                         Bug
                  125                                             4.9%                                                          Maintenance
      # Commits



                                                                                                                                Reliability
                  100
                   75
                   50
                   25
                    0
                        2.6.19
                        2.6.20
                        2.6.21
                        2.6.22
                        2.6.23
                        2.6.24
                        2.6.25
                        2.6.26
                        2.6.27
                        2.6.28
                        2.6.29
                        2.6.30
                        2.6.31
                        2.6.32
                        2.6.33
                        2.6.34
                        2.6.35
                        2.6.36
                        2.6.37
                        2.6.38
                        2.6.39
                           3.0
                           3.1
                           3.2
                           3.4
                           3.5
                           3.6
                           3.7
                           3.8
                           3.9
                          3.10
                          3.11
                          3.12
                          3.15
                          3.16
                          3.17
                          3.18
                           4.0
                           4.1
                           4.2
                           4.3
                           4.4
                           4.5
                           4.7
                           4.8
                           4.9
                          4.11
                          4.14
                          4.16
                          4.18
                          4.19
                          4.20
                           5.0
                           5.1
                           5.2
                           5.3
                           5.4
                           5.5
                           5.6
                           5.7
                           5.8
                           5.9
                          5.10
                          5.11
                          5.12
                          5.13
                          5.14
                          5.15
                          5.16
                          5.17
                          5.18
                          5.19
                           6.0
                           6.1
                           6.2
                           6.3
                           6.4
                           6.5
                           6.6
                           6.7
                           6.8
                           6.9
                          6.10
                          6.11
                          6.12
                          6.13
                          6.14
                          6.15
                                                                           Linux Kernel Versions
                                                Figure 1: File system evolution with different types of patches.

also non-functional properties critical for performance, such                           First, we design a formal method-inspired specification
as on-disk layout choices (e.g., bitmap vs. linear scan for                          to precisely define a file system’s behavior, moving beyond
block allocation). Furthermore, precisely specifying complex                         the ambiguity of natural language. It holistically captures the
concurrency control is notoriously difficult. Attempting to                          FS design, spanning Functionality, defined through Hoare-
describe both functional logic and fine-grained locking in a                         logic based pre/post-conditions [15, 55] and invariants; Mod-
single, monolithic prompt can overwhelm an LLM, causing it                           ularity, which enforces a clean decomposition into modules
to overlook subtle but critical details and produce code with                        with rely-guarantee [31, 55] interfaces for correct composi-
concurrency bugs.                                                                    tion; and Concurrency, which makes locking protocols and
Challenge II: Complex component composition. The finite                              ordering explicit to mitigate subtle bugs.
context window of LLMs precludes generating an entire file                              Second, S YS S PEC provides an LLM-based toolchain that
system monolithically. This necessitates a modular approach,                         translates the high-level specification into an executable C
which introduces significant composition challenges. First,                          implementation. The toolchain contains three LLM-based
generating one module at a time, an LLM lacks the global                             agents: the SpecCompiler, which systematically synthesizes
context to ensure interface compatibility with other, yet-to-be-                     C code from the specification using techniques like two-phase
generated or pre-existing components, leading to integration                         generation (logic first, then concurrency); the SpecValida-
errors. Second, each individual change (with LLMs) intro-                            tor, which rigorously validates the generated code against
duced during the evolution process can potentially trigger                           the specification and drives a retry-with-feedback loop to
cascading effects on other file system modules, particularly                         autonomously correct LLM errors; and then SpecAssistant
those with existing dependencies. For example, a seemingly                           which eases the development of specification.
local feature addition, like introducing extent [4], can trigger                        Third, we introduce a mechanism for principled evolu-
non-local changes by altering core data structures like the                          tion via spec patches. Instead of manually modifying C
inode, affecting any module that interacts with it and making                        implementation, developers add features by authoring a spe-
manual dependency management intractable.                                            cial patch, called spec patch, to the high-level specification.
Challenge III: Unreliable LLM capability. LLM-based                                  The S YS S PEC toolchain then automatically propagates this
code generation is inherently non-deterministic due to the hal-                      change, regenerating the implementation to ensure the new
lucination [26, 50] — even identical specifications can yield                        feature is correctly and consistently integrated.
different and potentially incorrect code outputs across gen-                            Overall, the new paradigm with S YS S PEC shifts the devel-
eration attempts. A naive “generate-and-pray” approach is                            oper’s burden from low-level implementation to high-level
unacceptable for system software. Therefore, a robust frame-                         design. While this demands greater upfront design effort, akin
work cannot blindly trust the LLM especially for file systems;                       to the safety discipline of Rust [13, 27], the return is a file
it must incorporate a rigorous validation mechanism to ensure                        system that is far easier to maintain and evolve.
that generated code strictly adheres to the guiding specifica-                          We utilize S YS S PEC to implement S PEC FS, a complete
tion, guaranteeing correctness despite the unreliability.                            FUSE-based (generative) file system specified entirely in spec-
   To address these challenges, our key insight is to replace                        ification. Our toolchain automatically generates a functional
ambiguous natural language with specifications following                             C-language implementation without any manual intervention.
the principles adapted from successful practices of formal                           We validate its correctness and expressiveness by success-
methods [15, 42, 55]. Specifically, we introduce S YS S PEC, a                       fully generating implementations of a previously verified file
framework for correct-by-construction file system generation                         system, AtomFS [55]. Besides, we showcase its capabil-
built on three core techniques.                                                      ity for complex feature integration by seamlessly evolving
                                                                                                                                       2198
S PEC FS with spec patches to support 10 novel features from               Semantic
                                                                                                                                2000
                                                                           Memory                   7.4%




                                                                                                                    # Commits
Ext4, including delayed allocation and file encryption. We                 Concurrency                 15.1%
                                                                           Error Handling
also highlight its benefits on performance: by applying Ext4-                               62.1%     15.4%                     1000
style delayed allocation method with a concise spec patch,                                                                                    388   261   171   139
S YS S PEC automatically regenerated the relevant modules,                                                                         0    1      2     3    4-5   >5
resulting in a 99.9% data write reduction for xv6 compilation.                                                                                # Files Changed
                                                                                     (a)                                 (b)
   To our knowledge, S YS S PEC is the first framework that       Figure 2: (a) Distribution of bug type. (b) Distribution of changed
enables both the generation and principled evolution of end-      files per commit.
to-end file systems like S PEC FS, shifting the developer’s               100
                                                                                                                        Performance




                                                                   Percentage (%)
focus from writing brittle low-level code to crafting robust,




                                                                    (Normalized)
                                                                                                                        Feature
high-level designs. S YS S PEC and S PEC FS is available at:                                                            Bug
                                                                           50
https://llmnativeos.github.io/specfs/.                                                                                  Maintenance
                                                                                                                        Reliability
                                                                            0 1         5 10          100        1000        10000
2     Characterizing the Evolution of File Systems
                                                                                                               Lines of Code
File systems usually require a continuous evolution to adapt to                                Figure 3: Patch LOC size CDF.
new hardware features and emerging use cases. This constant
adaptation includes adding new features, resolving bugs, and      after Ext4’s introduction. We also observe occasional peaks
optimizing for critical scenarios. Understanding the intricate    in the number of changes even during the stable period (Linux
process of file system evolution offers valuable insights for     2.6.19–3.4), such as over 50 changes in Linux 3.10 and over
future design. Prior work by L. Lu et al. [35] in 2013 provided   100 in Linux 3.16. This result suggests that a long-lived file
the first analysis of the Linux file system’s evolution. We       system like Ext4 is in a state of constant evolution.
continue the analysis with an extended study of evolution         Implication-2: Bug fixes and maintenance dominate a file
over a 20-year period (from 2005 to 2025), and identify new       system’s lifetime. While users are often drawn to a file sys-
implications that highlight the need to re-evaluate current       tem by its key features, e.g., Ext4’s use of extents, our analysis
file system paradigms, particularly in the context of the new     reveals that non-feature patches dominate the file system’s
opportunities provided by large language models.                  lifetime. Specifically, 82.4% of all commits focus on bug
                                                                  fixes and maintenance. Fig.2-a further shows the distribution
2.1     The Anatomy of File System Change                         of bug type, indicating that most bugs are semantic bugs. This
Methodology. We choose Ext4 as our target because it is a         finding presents an insight: although new features initially at-
mature and (still) widely-deployed file system with 20 years      tract users, the long-term success and widespread adoption of
of evolution in real-world environments. Ext4 was intro-          a FS depend heavily on its continuous maintenance. However,
duced in Linux 2.6.19 and has been continuously developed,        this high volume of maintenance work represents a signifi-
incorporating thousands of patches related to performance,        cant and ongoing burden, and current paradigms lack efficient
new features, and maintenance. Our analysis is based on all       solutions to handle it.
3,157 Ext4-related commits (i.e., individual patches rather       Implication-3: Feature-related changes are non-trivial.
than patch sets) merged into the mainline Linux from version      While feature-related commits constitute only 5.1% of the
2.6.19 to 6.15. To understand the evolution, we categorize        total changes, their impact is significant. Our analysis of the
each commit using a classification scheme for FS patches          code base, as shown in Fig. 1, reveals that these commits
adapted from prior work [36]: (1) Bug: fixing an existing bug,    account for 18.4% of the total lines of code (LOC) changed.
(2) Performance: improving efficiency through new designs         Furthermore, we observe that the introduction of a new feature
or optimizations, (3) Reliability: enhancing the file system’s    often acts as a catalyst for subsequent bug fixes and mainte-
robustness, (4) Feature: implementing new functionalities,        nance work. A new feature introduces a new code base, which
and (5) Maintenance: refactoring code or improving docu-          in turn necessitates follow-up commits to fix newly introduced
mentation without changing semantic behavior.                     bugs and maintain the code’s integrity. Consequently, despite
Implication-1: File systems consistently evolve. Our analy-       their low commit count, feature-related changes are central to
sis of Ext4 patches across Linux versions, as shown in Fig.1,     the overall evolution of a file system.
reveals a clear evolutionary trend. Initially, during the early   Implication-4: Evolution is taken in small steps. We mea-
stages (Linux 2.6.19–3.4), the high number of changes re-         sured the LOC for each patch and present the cumulative
flects extensive work on new features, bug fixes, and mainte-     distribution function (CDF) in Fig.3. Our analysis shows that
nance. The number of changes then decreases significantly         evolution proceeds through small, frequent changes. Specifi-
from Linux 3.4 to 4.18 as the codebase matures. However,          cally, about 80% of all bug fixes involve fewer than 20 LOC.
a surprising trend emerges: changes increase steadily after       While feature-related patches are generally larger, about 60%
Linux 4.19, peaking at Linux 5.10 — more than a decade            of them still require fewer than 100 LOC. Moreover, the vast
 // 1. Internal logical error.                                        Table 1: Prior code generation methods.“0 to N” denotes generat-
 - if (unlikely(error))                                               ing code from scratch, while “N to N + 1” refers to generating code
 ++ if (unlikely(error)) {
 ++    ext4_fc_stop_update(inode);                                    based on existing code, representing two categories of current work.
       return error;
 ++ }                                                                 Type Prior works        Precise Modular Concurrent Specification
 // 2. Cross-module collision.                                             Copilot [2]          ✗       ✓         ✗      Natural Language
                                                                      0 to
 - #define EXT4_MOUNT2_DAX_INODE 0x000010                                  Clover [46]          ✓       ✗         ✗      Docstring + Annotation
                                                                      N
    #define EXT4_MOUNT2_JOURNAL_FAST_COMMIT                                Qimeng [20]          ✓       ✗         ✗      Programming Language
    ,→ 0x000010                                                            AutoCodeRover [54]   ✗       ✓         ✗      Github Issue
                                                                      N to
 ++ #define EXT4_MOUNT2_DAX_INODE 0x000040                                 CodeAgent [53]       ✗       ✓         ✗      Natural Language
                                                                      N +1
      Figure 4: Two Example Patches in fast-commit.                        “Intention” [24]    Half     ✗         ✗      Natural Language
                                                                           S PEC FS             ✓       ✓         ✓      S YS S PEC + Toolchain

majority of commits also modify only a single file, as shown
in Fig.2-b. These findings suggest that file system evolution         tor and document the fast-commit implementation. Ex-
is composed of these manageable, small-scale changes.                 amples include: (1) Refactoring for readability, where
                                                                      logic for updating statistics is extracted into a dedicated
2.2     Case Study: Evolution of Fast Commit                          function, ext4_fc_update_stats(), to simplify the main
We present a case study to illustrate how different types of          ext4_fc_commit() pathway. (2) API clarification, which
patches are intertwined during the evolution. We use fast             involves enhancing flag descriptions in both the source code
commit [41], a hybrid journaling feature designed to optimize         and documentation to prevent misconfiguration.
fsync()-intensive workloads, as an example. Fast commit                  The lifecycle of the fast-commit feature exemplifies a core
reduces I/O overhead and latency by using lightweight, logical        challenge in the evolution of file systems: the initial integra-
commits, while periodically issuing full commits to maintain          tion of a feature is usually followed by a long tail of numerous,
consistency. It is one of the largest features introduced in          fine-grained fixes and refactoring efforts that are crucial for
Linux 5.10, comprising over 4,000 SLOC.                               stability and long-term maintainability.
Phase-1: Feature development. Our analysis covers 98 fast-
commit-related patches from Linux kernel 5.10 to 6.15. The            2.3 A New Paradigm: Generative File System
initial implementation is concentrated in version 5.10, which         The previous analysis reveals that FS development involves
includes 9 of the 10 feature-related commits. These initial           not only the inherent complexity of feature development but
patches collectively introduce jbd2 APIs for fast-commit sup-         also the long tail of maintenance and bug fixes. This entire
port, initialization and recovery paths, and the main commit          process is laborious and error-prone when performed man-
logic. In total, these commits add over 4,000 lines of code           ually in low-level C code. Luckily, the recent advances in
spanning multiple core modules (e.g., inode, file, journal).          Large Language Models (LLMs) offer an opportunity to ad-
Despite affecting several modules, the modifications are care-        dress this challenge. LLMs’ proficiency in code generation,
fully localized to minimize interference. This modular design         refactoring, and reasoning is well-suited for the high volume
preserves the existing journaling mechanism and on-disk for-          of maintenance and bug-fix tasks that consume the majority
mat while integrating the new fast-commit logic.                      of developer effort. Furthermore, the scope of code when
Phase-2: Bug fixes and stabilization. Development efforts             evolving a file system could typically fit within the context
shift to stabilization after the initial release. Of the 55 bug-fix   windows of modern LLMs (Implication IV, §2.1), making an
commits we have identified, over 65% address semantic er-             automated approach technically feasible.
rors, e.g., misordered updates and incorrect handling of corner          To this end, we propose the new paradigm of generative
cases. This high proportion of semantic bugs can be attributed        file system, i.e., leveraging LLMs to generate and evolve a
to the feature’s complexity and its deep integration with other       file system. The central thesis of our work is that: the path
Ext4 components. We classify these bugs as either internal            forward is not to replace developers with LLMs, but to elevate
(within the fast-commit logic) or cross-module (from inter-           their role by changing how they express design.
actions with other parts of Ext4). Fig.4 shows two examples.          Limitations of prior works. Although abundant prior works
The first illustrates an internal bug where an early return path      achieve automatic code generation, their inherent limitations
omitted necessary cleanup operations, leading to lost meta-           prevent us from leveraging them to achieve the paradigm for
data updates. The second shows a cross-module bug where               complex file systems, as generalized in Tab.1. These works
newly defined flags conflicted with existing journal checksum         can be broadly categorized into two types. First, some works
bits, requiring a redefinition of mount macros to resolve the         focus on generating complete code logic from scratch (“from
collision. These examples highlight the inherent difficulty of        0 to N”). However, this category of work struggles to cope
integrating features that span multiple modules, underscoring         with the complexity of file systems, whose modules exhibit
the need for careful reasoning about global system invariants.        intricate interactions and dependencies. Consequently, such
Phase-3: Code maintenance. Alongside bug fixes, 24 main-              approaches either produce only simple code (e.g., frontend
tenance commits (totaling 1,080 lines) are applied to refac-          pages) or are limited to specific single-module tasks [20, 46],
                                                                                                                  SpecFS file system
                                                                                     SpecFS
                                                                                                                  Key components of SysSpec framework
                                SysSpec                                                        Module-4
                                                                                 Module-3

                                                                                 Module-1      Module-2            Spec patch

          Functionality        Modularity        Concurrency                   Generation      Evolution          Update Mod-1            Update Mod-2
          Speciﬁcation        Speciﬁcation       Speciﬁcation                     LLM-based Toolchains            with change-1           with change-2
                                                                                         (Agents)

          Implement SpecFS following the design in SysSpec                                                          Update Mod-3           Update Mod-1
                                                                                     ImpFS
                                                                                                                    with change-3          with change-4
                                                                                               ImpMod-4
             SpecFS                    read: pre:=.., post:=..,
                                                                                 ImpMod-3
                                                                                                                                     +
                                            invariants=..                                                           SpecFS
                          Module-4                                  Fail &       ImpMod-1      ImpMod-2
                                       Rely: module-2/3           Retry with                                     Mod-1       Mod-3       Mod-4        Mod-2
         Module-3                      Guarantee: read            feedbacks
                                       Con: pre:=cur is                              Validation agent
                                       locked, post:=.., no                                                                              Generation
         Module-1         Module-2
                                       double release                              Runtime Deployment               ImpFS’ (with new feature in the patch)

                          (a) Design Cycle                                     (b) Runtime Workflow                (c) Evolution with Spec Patch
Figure 5: Design overview. (a) Developers write a file system (S PEC FS) using a structured specification language that defines functionality,
modularity, and concurrency. (b) An LLM-based toolchain generates a low-level implementation (ImpFS) from the specification and uses a
validation agent to ensure correctness. (c) The file system evolves by applying a high-level spec patch to S PEC FS, after which the toolchain
regenerates the implementation to include the new features or fixes.

such as generating tensor program implementations for differ-                            3     Design Overview
ent hardware [20], generating unit tests [14,43], mathematical
library functions [12], or performing bit-vector synthesis [19].                         This paper presents S YS S PEC, an end-to-end framework
                                                                                         for developing specification-based generative file systems.
   Second, other approaches usually focus on evolution,                                  S YS S PEC carefully applies principles from formal methods
i.e., modifying existing code (“from N to N + 1”). They                                  to create structured, high-level specifications. While not
may utilize methods like Retrieval-Augmented Generation                                  strictly formal, these specifications provide a sufficiently pre-
(RAG) [24, 49] or Agents [2, 3, 24, 25, 53, 54] to enhance gen-                          cise blueprint to effectively guide LLMs in generating and
eral code generation capabilities. However, these methods                                evolving complex FS implementations.
largely rely on natural language descriptions (e.g., document                            The S YS S PEC specification. At the core of our framework is
strings, GitHub issues [54] or code review comments [24])                                a multi-part specification that captures a developer’s design
for the desired program logic. Even though some methods                                  intent, as shown in Fig. 5-a. It consists of: (1) Function-
attempt to enhance the LLM’s capability to understand in-                                ality specifications, which use concepts like Hoare logic
tents expressed in natural language [24], ambiguity remains                              (pre/post-conditions) and invariants to describe the behavior
unavoidable: one cannot simply instruct an LLM to “avoid                                 of individual modules. (2) Modularity specifications, which
race conditions” and expect a correct outcome. Furthermore,                              decompose the system into distinct components and use a rely-
these methods often include all project-related code in the                              guarantee discipline [21] to ensure they can be composed
context, requiring the Agent to autonomously decide how to                               correctly and developed independently. (3) Concurrency
retrieve information from this context. Such a burden is un-                             specifications, which explicitly define locking protocols and
controllable, and an excessively long context can potentially                            other concurrency-related behaviors that are notoriously diffi-
degrade the quality of code generation.                                                  cult for LLMs to infer on their own.
                                                                                            S YS S PEC shifts the developer’s role from writing low-
Insight and challenges. Our key insight is that we could                                 level C code to authoring a high-level design. This paradigm
guide the LLM using principles derived from formal methods,                              usually demands a greater upfront investment in design, much
rather than imprecise natural language prompting. Such a                                 like the safety guarantees in Rust require more care than
formally structured specification is expected to address the                             traditional C programming. However, the payoff is significant:
challenges outlined in §1 simultaneously. First, a semantic                              once specified, the file system is more robust, easier to evolve,
gap arises when specifying module logic, necessitating resolu-                           and better suited for diverse scenarios because the developer
tion of (i) semantic ambiguities, (ii) deep domain knowledge                             is forced to reason about the design concretely.
awareness, and (iii) thread-safe requirements. Second, com-                                 Besides, S YS S PEC streamlines evolution using spec
plex component composition demands careful consideration                                 patches, as shown in Fig.5-c. Instead of manually modifying
of inter-module dependencies and mitigation of cascading                                 thousands of lines of C code to add a feature, a developer
effects induced by each evolutionary patch across other mod-                             writes a patch containing either new specifications or modifi-
ules. Third, the inherent unreliability of LLM capabilities                              cations to an old one. Our toolchain then applies this patch
poses a critical barrier to robust system generation.                                    and regenerates the low-level implementation, ensuring the
change is propagated correctly throughout the system.                1    /* Hoare-style Specification */
                                                                     2    Pre-condition:
The S YS S PEC toolchain. S YS S PEC provides an LLM-based           3      path: a NULL-terminated string array
toolchain that translates the high-level specification into an       4      name: a valid string
                                                                     5    Post-condition:
executable implementation. As illustrated in Fig. 5-b, this          6    Case 1 Successful traversal and insertion
toolchain includes agents: The SpecCompiler agent trans-             7      - New inode created
lates the specification (S PEC FS) into a low-level C-language       8      - Entry inserted into target directory
                                                                     9      - Return 0
implementation (ImpFS). To manage the current limitations of        10    Case 2 Traversal or insertion failure
LLMs, it uses techniques like two-phase prompting to handle         11      Return -1
                                                                    12    Invariant: root_inum always exists
complex logic. The SpecValidator agent ensures the correct-
                                                                      Figure 6: Simplified functionality specificaiton for atomfs_ins
ness of the generated code, employing a retry-with-feedback
loop to automatically identify and correct errors. With the
                                                                    the most complex cases involving highly optimized designs
designs of S YS S PEC, our evaluation shows significant correct-
                                                                    (Level 3), providing an explicit algorithmic description be-
ness improvements for complex operations compared to naive
                                                                    comes essential, as it is unreasonable to expect an LLM to
prompting (up to 34.4%). We also provide SpecAssistant to
                                                                    derive such logic from scratch.
ease the development of specification.
                                                                    Hoare logic for file system synthesis. To specify function
Case study: S PEC FS. With S YS S PEC, we design and im-
                                                                    behavior, we adapt the classic Hoare logic formalism of
plement S PEC FS, a complete file system written entirely
                                                                    {P}C{Q} using pre- and post-conditions, but we sidestep
in the S YS S PEC specification language. Our toolchain can
                                                                    the high complexity of full formal verification. Each function
automatically generate a functional C-language implemen-
                                                                    is annotated with pre-conditions that define required system
tation of S PEC FS without human intervention. Through a
                                                                    states and post-conditions that guarantee specific state transi-
series of case studies, we demonstrate that S PEC FS can seam-
                                                                    tions and return values. Fig.6 shows atomfs_ins, an internal
lessly evolve via spec patches to support sophisticated features
                                                                    function of AtomFS [55] that implements mknod/mkdir. The
found in Ext4, e.g., extents or delayed allocation.
                                                                    pre-condition describes the validness of the parameters. The
                                                                    post-condition describes the state after the operation.
4     S YS S PEC Framework                                             Our approach diverges from traditional formal methods in
                                                                    two key aspects. First, an LLM enforces adherence to this
4.1    Functionality Specification                                  logic during code generation, replacing the role of a formal
                                                                    theorem prover. Second, to balance the comprehensibility
The functionality specification defines the behavior of a mod-      and unambiguity of the specification, our specifications are
ule by describing its state transitions. A module is a collection   expressed in structured natural language augmented with type
of related state variables and functions. The specification is      annotations rather than pure mathematical logic, thereby mak-
built upon three components, inspired by formal methods.            ing them more accessible. S YS S PEC augments the semantic
   First, pre- and post-conditions, following Hoare Logic,          precision of natural language with a structured organization
define the contractual obligations for each function by speci-      for the specifications (e.g., sections for functionality, modu-
fying the required state before execution and the guaranteed        larity, and concurrency), and uses mathematically disciplined
state upon completion. Second, invariants are properties            natural-language expressions to ensure that the intended se-
that must hold true across all state transitions, ensuring the      mantics remain precise and unambiguous while keeping the
module’s integrity. Such Hoare-logic-based specification ap-        specification accessible. For example, the specification states
proach inherently avoids the need for explicitly constructing       that the file size equals max(old_size, offset + len), rather than
the entire state space, thereby directly circumventing the prob-    that the write updates the file size if necessary. These designs
lem of state space explosion. Finally, a system algorithm           significantly limit the potential for misinterpretation.
outlines the high-level logic for how a function should achieve     Invariant-guided specification. In addition to per-function
its state transition, guiding the LLM’s implementation strat-       contracts, developers specify system-wide invariants that
egy. Rather than always providing a complete system algo-           describe properties valid across all states during execution.
rithm, our experience shows that a high-level intent is often       For example, an invariant may state that:
sufficient. The intent can be regarded as a lightweight sys-
                                                                    [ Invariant ] any modification of an inode must
tem algorithm that, expressed in natural language, guides the
                                                                    occur while holding the corresponding lock
LLM in generating the desired implementation.
   Not all of these components are required for every mod-          Such invariants define constraints that functions must respect
ule. We find that the necessary level of detail scales with         throughout their execution, and cannot be fully expressed us-
complexity. For straightforward modules (Level 1), pre/post-        ing only local pre- and post-conditions. For another example,
conditions and (sometimes) invariants are often sufficient.         the root existence invariant in Fig.6 allows the generated code
As the logic becomes more intricate (Level 2), adding an            to safely omit null checks when accessing the root.
intent description is recommended to clarify the design. For        System algorithm. While pre- and post-conditions define
what a function must accomplish, they do not specify how.             1    [RELY]
                                                                      2    Predefined Structures/Functions:
Our experience shows this is insufficient for performance-            3    struct inode { ... };
critical systems, as an LLM might generate an implemen-               4    struct inode* root_inum;
                                                                      5    void lock(struct inode*)
tation that satisfies the specification but is highly inefficient.    6    void unlock(struct inode*)
E.g., given a specification for a sort() function, an LLM could       7    struct inode* locate(struct inode* cur, char*
correctly generate a bubble sort (O (n2 )) just as easily as a             ,→ path[]) // Traverse path under cur
                                                                      8    void insert(struct inode*, struct inode*,
quicksort (O (n log n)). To address this, the system algorithm             ,→ char*) // ...
component allows developers to explicitly outline the method          9    int check_ins(struct inode*, char*) // ...
                                                                     10
for achieving a state transition. This provides crucial guid-
                                                                     11    [GUARANTEE]
ance, ensuring the LLM implements a performant algorithm,            12    Exported Interface:
such as using lock coupling for fine-grained concurrency in-         13    int atomfs_ins(char*[], char*, int,
                                                                     14                  unsigned, unsigned)
stead of a coarse-grained global lock.
                                                                     Figure 7: Rely-Guarantee specifications for atomfs_ins. Both
   For example, in the functionality specification of                rely and guarantee conditions are simplified for clarity.
atomfs_rename, we define the algorithm in three phases:
(1) traversing the common path, (2) traversing the remaining         their declared dependencies (Rely), (2) provide guarantees
path and (3) checks and operations. We explicitly specify            about their behavior (Guarantee), and (3) compose through
the fine-grained locking scheme used in these phrases, which         logical implication of these contracts.
enables the correct generation of atomfs_rename, a function             A critical adaptation occurs in re-imagining rely-guarantee
that is both highly complex and prone to deadlock.                   reasoning, originally developed for concurrent thread veri-
Intent. LLMs are trained on vast codebases and can often             fication, for modular system synthesis. Where traditional
produce highly optimized code when given the right high-             rely conditions specify permissible environment interference
level guidance, even without a complete system algorithm.            for threads, S YS S PEC’s Rely clauses enumerate a module’s
The intent component in S YS S PEC is designed to provide            assumptions about other components. Similarly, Guarantee
such guidance. First, it describes the high-level goal of a          clauses replace thread behavior specifications with module
function in natural language, e.g., “successful traversal and        interface contracts. Each module’s Rely conditions must be
insertion” in Fig.6 indicates that the target directory is identi-   entailed by the Guarantees of its dependencies, enabling com-
fied through file-tree traversal. Second, it allows developers       positional correctness through localized synthesis.
to inject domain-specific knowledge to steer the LLM toward             In Fig.7, the module’s Rely clause imports critical elements
better implementation choices, complementing the correct-            from its dependent modules, e.g., the definition of structures,
ness guarantees provided by the Hoare logic and invariants.          lock/unlock primitives, path traversal function. The generated
E.g., when reading a large file extent, a developer can use          code then exports its own Guarantee, allowing dependents
the intent to suggest a single, bulk I/O operation. Without          to build upon its functionality without needing to understand
this hint, an LLM might generate a correct but inefficient           internal implementation details.
implementation that reads each disk block individually.              Incorporation with external code. S YS S PEC also supports
                                                                     incorporating external code (e.g., libraries) via the Rely-
4.2    Modularity Specification
                                                                     Guarantee framework. External code can be integrated by first
S YS S PEC addresses the composition challenge, avoiding             exposing their Guarantees. Developers then specify depen-
interface-level dependency errors through a methodology that         dencies on these exposed guarantees within the Rely clause
combines interface contracts with LLM context management.            of their specifications. During code generation, the external
Context-bounded modular synthesis. One of the core inno-             code is treated as a satisfied dependency, enabling the gener-
vations in S YS S PEC’s modularity specification lies in aligning    ated module to correctly invoke external functions without
module design with two intrinsic properties of LLM reasoning.        reimplementing them.
First, strict size constraints ensure each module fits entirely
within the model’s context window, enabling holistic analysis        4.3    Concurrency Specification
during generation. The specific constraints on module sizes          Concurrency poses one of the most significant challenges in
evolve in tandem with improvements in LLM capabilities and           FS implementation. A naive approach within the S YS S PEC
context window capacities. Take our case study (§5) as an            would be to describe concurrent behavior using the existing
example, we limited module sizes to ≤500 LoC, which keeps            functionality specification, defining lock states as pre- and
the token consumption for inference generally within approx-         post-conditions and outlining the logic in the algorithmic de-
imately 30K tokens. Second, explicit interface contracts             scription. While plausible in theory, our experience reveals
govern inter-module dependencies through Rely-Guarantee              that LLMs struggle to correctly synthesize complex concur-
conditions, a formal mechanism adapted from concurrent pro-          rent logic from such unified specifications alone. E.g., when
gram verification [55]. This methodology embodies three              tasked with implementing the notoriously complex rename,
critical principles: (1) module implementations must respect         state-of-the-art LLMs consistently failed to generate a correct
 1     [Rely]                                                       4.4    DAG-Structured Specification Patch
 2     [Locking Specifications of locate]
 3     Pre-condition: cur is locked.
 4     Post-condition: suppose return target.                       We introduce a DAG (Directed Acyclic Graph) structured
 5     - if target is NULL, no lock owned.                          specification patch, a mechanism that simplifies the evolution
 6     - if target is not NULL, only target is owned.               of spec-based file systems. This approach provides a self-
 7     [Locking Specifications of check_ins]
 8     Pre-condition: cur is locked.                                contained description of a new feature, explicitly organizes
 9     Post-condition:                                              the dependency changes, and defines a clear and consistent
10     - if check_ins returns 0, cur is locked.
11     - if check_ins returns 1, no lock is owned.
                                                                    workflow for applying the evolution.
12                                                                  The leaf node: a self-contained change. The evolution pro-
13     [Locking Specifications of atomfs_ins]                       cess begins at a leaf node of the DAG, which has no depen-
14     Pre-condition: no lock is owned.
15     Post-condition: no lock is owned.                            dencies on other patch nodes. The specification in a leaf node
     Figure 8: Concurrency specifications for atomfs_ins.           represents a localized, self-contained change, typically within
 1 int atomfs_ins(char* path[], char* name, ...) {
                                                                    a single module. It introduces new logic and provides new
 2    lock(root_inum);                                              guarantees without affecting any other part of the existing
 3    struct inode* target = locate(root_inum, path);               system. A leaf node can also define new data structures or
 4    if (!target) return -1;
 5    if (check_ins(target, name) != 0) return -1;                  functions that subsequent nodes in the patch will rely on.
 6    struct inode* new_inode = malloc_inode(...);                  Intermediate nodes: building on guarantees. An interme-
 7    insert(target, new_inode, name);
 8    unlock(target);                                               diate node represents a step in the evolution that builds upon
 9    return 0;                                                     previously introduced changes. Its specification relies on the
10 }
                                                                    new guarantees provided by its child nodes to implement
     Figure 9: LLM-generated atomfs_ins with S YS S PEC.
                                                                    more complex logic. In turn, this node provides its own,
                                                                    higher-level guarantees, forming a clear dependency chain
implementation that satisfied the specification.                    that progressively constructs the new feature. In principle,
   Our key insight is to decouple concurrent logic from the         any modification to a guarantee necessitates corresponding
functional logic. We separate the concurrency design (e.g.,         specification adjustments for all modules that depend on it,
locking) into a standalone concurrency specification. This          i.e., these modules are included in the patch as intermediate
specification is a specialized version of the functionality spec-   nodes to preclude potential compatibility issues.
ification, focusing solely on concurrent behavior.                  The root node: the integration point. The root node is the
   During code generation, our toolchain first directs the LLM      culmination of the evolution, acting as the final integration
to generate a correct sequential version of the code, focusing      point. Unlike the “tree” structure, a “DAG” structured patch
only on the primary functionality. Once this sequential imple-      may have multiple root nodes. Root nodes are characterized
mentation is validated, the toolchain performs a second pass,       by the property that their specification provides semantically
using the dedicated concurrency specification to instrument         unchanged guarantees. This equivalence is critical, as it al-
the code with the required locking and other concurrent be-         lows the entire chain of new functionality, built up through
haviors. This separation of concerns makes the synthesis task       the DAG, to safely and transparently replace an old imple-
tractable for current LLMs, allowing them to correctly handle       mentation. This substitution serves as the “commit point”,
two distinct, complex problems one at a time.                       where the evolution is atomically applied to the base system.
   Fig.8 shows an example of the concurrency specification.         Evolution involving existing modules. Nodes within a DAG-
The implementation of atomfs_ins relies on locate and               structured specification patch includes both new modules and
check_ins. In its concurrency specification, the Rely clauses       modifications to existing ones. A modified existing module is
capture the locking requirements of these internal functions.       treated as a “new module,” which can largely reuse the exist-
Specifically, since locate requires the cur lock as a precon-       ing specification. If a shared component (e.g., inode) is mod-
dition, while atomfs_ins itself has no such precondition,           ified, all dependent modules must be regenerated to “rely” on
the generated code must first acquire the lock on root_inum         the updated version, while other parts of their specifications
before invoking locate(root_inum, path). This implies               may not require any modifications. These modified modules
that when implementing a module with S YS S PEC, the LLMs           then replace the original ones after the patch is merged.
considered not only the functional dependencies between             The evolution process. The unidirectional dependencies be-
modules but also their locking dependencies.                        tween nodes naturally form a DAG, which dictates the evo-
Putting it together. Fig. 9 shows an example of generated           lution workflow. The process begins with the S YS S PEC
atomfs_ins. The code fulfils the functionalities defined by         toolchain (§4.5) generating code for the leaf nodes. It then
the pre- and post-conditions, correctly invokes functions from      traverses the graph upwards, synthesizing the implementation
other modules in accordance with the modularity specifica-          for each parent node by leveraging the freshly generated guar-
tion, and handles lock acquisitions/releases properly as speci-     antees from its children. This continues until the toolchain
fied by the concurrency specification.                              reaches the root node, at which point the new feature is fully
implemented and integrated into the file system.                    fully-generated module against the combined functionality
                                                                    and concurrency specifications. Second, it integrates with
4.5    The S YS S PEC Toolchain                                     standard software engineering workflows by running a suite
We have designed and implemented three LLM-based agents,            of unit and regression tests against the final C-language file
SpecCompiler, SpecValidator, and SpecAssistant, that form           system. This process emulates a modern CI/CD pipeline: the
the core toolchain for the S YS S PEC to serve the entire life-     SpecEval component acts as an automated code reviewer
cycle of generative file system development, The toolchain          verifying adherence to the design, while the test suite ensures
further effectively mitigates hallucinations in LLMs by ad-         that no existing functionality has regressed.
dressing two key aspects: (1) it helps that LLMs produce            The SpecAssistant agent. SpecAssistant streamlines specifi-
outputs aligned with those specifications through the coordi-       cation development through a human-in-the-loop process. A
nation of SpecCompiler and SpecValidator, and (2) it helps          developer provides a draft specification, which the SpecAssis-
developers in producing correct specifications by leveraging a      tant first validates and reformats to meet S YS S PEC’s syntax.
strictly structured specification format and the SpecAssistant.     The agent then enters an automated refinement loop. It re-
The SpecCompiler agent. The SpecCompiler agent is respon-           peatedly invokes the SpecCompiler; if the SpecCompiler’s
sible for translating the high-level, specification-based file      SpecEval phase identifies a flaw, the SpecAssistant uses a
system into a low-level C-language implementation (ImpFS)           new SpecFine step to automatically polish the specification
that can be compiled and deployed. Analogous to a traditional       based on the feedback before retrying. This loop concludes
compiler, it processes the source specification and outputs         in two ways. On success, the SpecAssistant provides the
machine-usable code. Thanks to our modular design, the              developer with the refined specification and the C implemen-
SpecCompiler can operate on one module at a time, confident         tation for validation. On failure, it returns the last attempted
that the strict enforcement of rely-guarantee conditions will       specification annotated with detailed diagnostics, serving as a
ensure seamless integration into a monolithic whole.                debug log that guides the developer in resolving the issue.
    For each module, the SpecCompiler employs two primary
techniques. The first is two-phase prompting, which lever-
ages our separation of concerns in the specification. The
                                                                    5     S PEC FS: A Case for Generative FS
agent’s first phase generates a correct sequential implementa-
tion of the module, focusing only on its core functionality. In     5.1     Prototype Implementation
the second phase, it uses the dedicated concurrency specifi-        Overview. To demonstrate the benefits of S YS S PEC, we in-
cation to instrument this sequential code with the necessary        troduce S PEC FS, a concurrent in-memory file system that
locking and concurrent behaviors.                                   runs in userspace via FUSE. The architecture is based on
    The second technique is an iterative retry-with-feedback        a prior formally verified file system, AtomFS [55]. How-
loop used within each phase. This loop involves two distinct        ever, rather than porting its C implementation, we under-
LLM roles: a CodeGen agent generates the implementation,            take a complete reimplementation guided by our specification.
and a separate, reasoning-focused SpecEval agent reviews            Specifically, we implement AtomFS’s high-level design with
the output against the specification. If the SpecEval agent         S YS S PEC’s specifications, including pre- and post-conditions
identifies a flaw, it does not simply report failure; instead,      (we re-use some conditions from AtomFS’s formal specifi-
it generates specific, actionable feedback (e.g., “The case         cations in Coq), invariants, rely/guarantee contracts, system
where function foo() fails is not handled”). This feedback is       algorithm descriptions, and concurrency specification.
then appended to the original prompt, and the CodeGen agent            S PEC FS is organized into 45 distinct modules distributed
retries. This refinement cycle continues until the generated        across several logical layers, including file operations, in-
code satisfies the specification or an attempt-limit is reached.    ode management, path traversal, and the POSIX interface.
    This dual-agent design is critical for overcoming LLM           S PEC FS supports a wide range of standard POSIX calls, such
hallucination. In our experience, the code-generation LLM           as open, read, and rename. To validate its functional correct-
will occasionally produce incorrect implementations, even           ness, we use the xfstests [17] suite within our SpecValida-
with a precise specification. However, the SpecEval agent           tor. S PEC FS demonstrates a level of correctness equivalent
effectively detects these flaws. This is because verifying a        to that of the original AtomFS, failing only 64 out of 754 test
solution against a set of rules is a simpler cognitive task than    cases, all attributable to unimplemented functionality.
generating the solution from scratch, and the probability of        System complexity and comprehensibility. While S PEC FS
two distinct models making complementary errors on the              serves as our prototype, it is a non-trivial file system by any
same logic is exceedingly low.                                      measure. The generated C implementation comprises approx-
The SpecValidator agent. The SpecValidator agent performs           imately 4,300 lines of code. To put this figure into context,
the final, holistic verification of the complete ImpFS. It com-     we compared it against the 82 file systems in the Linux 6.1.10
bines specification-based review with traditional testing. First,   kernel. S PEC FS ranks 42nd by line count, surpassing estab-
it re-uses SpecEval logic from SpecCompiler to check each           lished systems like squashfs and nearly matching the size
Table 2: Case study of applying Ext4 features to AtomFS. “Propose” and “Launch“ indicate the year an feature proposed and the year it is
merged. “Release“ indicates the Linux version with the feature. "Indirect Block" is an exception in the table, as it originates from ext2/3.

   Type     Feature                         Propose     Launch      Brief Description                                              Release
            Indirect Block (Ext2/3)               /           /     One-to-one block mapping via multi-level pointers                  /
     I      Extent                             2006        2006     Contiguous block ranges reducing metadata by 50%                2.6.19
            Inline Data                        2011        2013     Store small files in inode’s unused space                         3.8
            Multi Block Pre-Allocation         2006        2008     Benefit large files by allocating blocks in groups              2.6.25
     II     Delayed Allocation                 2006        2008     Deferred block allocation for reducing I/O operations           2.6.27
            rbtree for Pre-Allocation          2022        2023     rbtree to organize the pre-allocated block pool                   6.4
            Metadata Checksums                 2011        2012     Checksummed filesystem metadata structures                        3.5
     III    Encryption                         2015        2015     Per-directory encryption with low overhead                        4.1
            Logging(jbd2)                      2006        2006     Journaling support for 64-bit filesystems                       2.6.19
     IV     Timestamps                         2006        2006     Nanosecond resolution timestamps in inode structure             2.6.19


of 9pfs. We choose C as the programming language as it                   5.2      Case Study of Evolutions
remains the de facto standard and is most widely used for low-           One benefit of a specification-based generative FS is the en-
level file system developments. While high-level languages               hancement of the evolvability. In this section, we evolve the
like Rust may be applicable in the future, they present trade-           design of S PEC FS with 10 well-known Ext4’s features (Tab.2)
offs between the benefits from their inherent features (e.g.,            using spec patches1 , as a case study. These ten features are
memory safety) and the increased specification complexity                classified into four categories that current S YS S PEC can sup-
(e.g., due to Rust’s ownership model). Moreover, we observe              port: (I) File structure modification, which modifies the under-
that the generated code of S PEC FS is highly comprehensible.            lying data structures within the file system; (II) Design update
LLMs naturally adhere to standard coding conventions and                 for existing operations, which modifies the specific behavior
generate explaining comments, mirroring the style of human               of existing operations, without altering the intended outcome
engineers.                                                               of these operations; (III) New functionalities implementation
                                                                         with new operations; (IV) Hyperparameters or metadata mod-
Workflow. S PEC FS features a unique runtime translation
                                                                         ification, e.g., changing the FS’s block size from 32-bit to
workflow, as shown in Fig. 5-b. It begins with our LLM-
                                                                         48-bit. Tab.2 presents the specific type of each feature and a
based agents generating C code for each module based on
                                                                         brief description of its implementation logic.
its specification. A background daemon then compiles the
                                                                         Example: Extent. This feature transforms the file struc-
generated code and validates it using the SpecValidator. Once
                                                                         ture from individual blocks into extents. Each extent
validated, the compiled components are deployed into the
                                                                         records a segment of contiguous blocks, facilitating sequen-
host OS. To mitigate the latency associated with LLM-based
                                                                         tial reads and writes. The modification process (Fig. 10)
generation, successfully validated module implementations
                                                                         begins by defining new data structure for extent and
are cached for immediate reuse. When the specification is
                                                                         inode. Then, it updates the low-level file operations in
updated, regeneration is triggered asynchronously, allowing
                                                                         lowlevel_file (and corresponding initializations) to incor-
the file system to remain fully operational while the new
                                                                         porate new extent-based file I/O operations. Subsequently, the
version is prepared in the background.
                                                                         inode_management module is modified to invoke these new
                                                                         extent operations. Since the new inode_management pro-
Experience for developing S PEC FS. We gain several ex-
                                                                         vides the same guarantee as the original inode_management,
periences during the development of S PEC FS. First, while
                                                                         the new inode_management serves as the root node of the
strict S YS S PEC adherence effectively ensures accuracy of
                                                                         entire patch and directly replaces the original one, making the
code generation (§6.1), simplified specifications (e.g., sim-
                                                                         complete set of new operations visible to the entire system.
plify Rely/Guarantee) can occasionally still result in logically
correct code. If the objective is to maximize development
efficiency, one might consider making a trade-off between                6     Evaluation
generation accuracy and the use of simplified specifications.
Second, to debug S PEC FS, we initially locate bugs in the               6.1      Evaluations on Accuracy
generated C code, consistent with debugging methods for
human-written code. Once a bug is localized, the debugging               Methodology. We first study whether S PEC FS can accurately
process additionally involves validating the high-level design           generate code to achieve self-evolution, that is, whether the
against the specification. In our experience, most issues in                 1 The Appendix supplements the DAG structures of the patches used for

S PEC FS are diagnosed at the specification level.                       specifying these features.
                                                                                                                   Table 3: Ablation study. The evaluation uses DeepSeek-V3.1 Rea-
                     inode                     extent                      Leaf Node            Root Identifier
                                                                                                                   soning. “Func”, “Mod”, “Con” means Functionality, Modularity
                 initialization            initialization                  Intermediate Node                       and Concurrency Specifications respectively.
                inode & extent                                       inode                        extent
                                           lowlevel_file                                                               Modules        Func      +Mod      +Con     +SpecValidator
                   structure                                      management                    operations
Figure 10: DAG-Structured patch for implementing “Extent”.                                                           Concurrency-    40.00%     100%      100%         100%
For simplicity, a node in the figure may encompass multiple modules                                                    agnostic      (12/40)   (40/40)   (40/40)      (40/40)
of specifications. “Root Identifier” indicates that this node is the                                                   Thread-         0%         0%       80%         100%
root (along with its associated logic).                                                                                  safe         (0/5)      (0/5)    (4/5)        (5/5)

                  Normal          Oracle       SpecFS                         Normal      Oracle     SpecFS
    100                                                         100
Accuracy (%)




                                                            Accuracy (%)

           80                                                          80
           60                                                          60
                                                                                                                   64 functional modules, and we report their overall accuracy.
           40                                                          40                                          As depicted in Fig.11-b, S PEC FS consistently exhibits higher
           20                                                          20                                          generation accuracy across all evaluated models. This fur-
               Gemini-2.5 DS-V3.1      GPT-5 QWen3-32B                     Gemini-2.5 DS-V3.1    GPT-5 QWen3-32B   ther substantiates the effectiveness of S YS S PEC. Noted that,
                       (a) AtomFS.                                                (b) Features.                    due to many features being implemented primarily through
Figure 11: Accuracy results for implementing AtomFS or new                                                         modifications to existing specifications, and involving less
features. “GPT-5” in the figure denotes GPT-5-minimal.
                                                                                                                   complex concurrency logic, the accuracy of implementing fea-
                                                                                                                   tures is higher than implementing atomfs from scratch, further
code generation can accurately conform to the logic described                                                      reflecting the feasibility of using LLMs for FS evolving.
by the specification and accurately meet the functionality of                                                      Generalizability for various locking methods. We evaluate
the corresponding file system module. Our test cases com-                                                          whether the concurrency specifications of S YS S PEC are gen-
prise all the modules to implement the complete logic of                                                           eral for various locking methods. To this end, we utilize the
AtomFS [55]. Specifically, to evaluate the accuracy, we first                                                      dentry_lookup operation in the VFS layer of Linux, as it
define 45 distinct modules within AtomFS and manually au-                                                          exhibits locking requirements at multiple granularities: a lock
thor their ground-truth implementations. A generated module                                                        must be acquired for the entire hash list during traversal, while
is considered correct if it (i) passes all functional tests for                                                    individual locks are also required for each dentry upon access.
AtomFS and (ii) is deemed logically equivalent to the ground-                                                      In our concurrency specification, we explicitly designate the
truth through manual inspection.                                                                                   use of two distinct locking mechanisms—lock-free RCU for
   We implement two versions of baselines based on a few-                                                          the hash list and spinlocks for individual dentries. Our experi-
shot learning approach. The normal version incorporates a                                                          ments verify that the generated code correctly adheres to the
description of the file correspondence logic and the APIs of                                                       specified concurrency semantics, successfully producing code
the dependency modules; The oracle version not only includes                                                       that implements multi-granularity and multi-method locking
the dependency module’s APIs but also integrates the ground-                                                       logic as intended. See details about the specification and the
truth code of these modules as part of the prompt. We test gen-                                                    generated code of the two phases in the Appendix.
eration accuracy using four LLMs of decreasing capability:
Gemini-2.5-Pro [7], DeepSeek-V3.1 Reasoning [18], GPT-                                                             6.3    Ablation Study
5-minimal [8], and Qwen3-32B [51], whose performance is                                                            We evaluate how S PEC FS’s designs effectively improve the
ranked according to the LiveCodeBench leaderboard [9].                                                             accuracy of code generation. We first divide AtomFS’s 45
Accuracy results. To evaluate accuracy, S PEC FS uses the                                                          modules into 40 concurrency-agnostic modules and 5 thread-
same specification to generate code for the 45 modules with                                                        safe modules, and then assess the accuracy for implement-
the four models, and the accuracy results are presented in                                                         ing these modules under different design configurations, as
Fig. 11-a. We observe that on more powerful models such                                                            shown in Tab. 3. According to the evaluation, we observe
as Gemini-2.5-Pro and DS-V3.1, S PEC FS achieves 100%                                                              that although the functionality specification alone is insuffi-
accuracy, completely generating all functional modules of                                                          cient for correctly generating complex file system (primarily
S PEC FS. In contrast, even when the oracle baseline imple-                                                        due to interface mismatch), when combined with the mod-
mentation possesses all contextual code, the accuracy of code                                                      ularity specification, it effectively supports the generation
generation using the most capable Gemini-2.5-Pro is 81.8%.                                                         of concurrency-agnostic modules. Nevertheless, that is not
This demonstrates that S PEC FS’s specification design signifi-                                                    enough to accurately produce thread-safe modules. S PEC FS
cantly enhances code generation accuracy for the file system.                                                      further addresses this limitation by incorporating a concur-
                                                                                                                   rency specification and agent-supported self-validation to
6.2                   Evaluations on Generalizability
                                                                                                                   achieve correctness and robustness for thread-safe modules.
We further evaluate how S YS S PEC can support the generation
of a wider range of file system logic. To this end, we evaluate                                                    6.4    Evaluations on Productivity
whether S PEC FS can accurately generate the ten features de-                                                      We further evaluate how S PEC FS improves the productivity.
tailed in Tab.2. These ten new features encompass a total of                                                       We compare the development costs of manual implementa-
                       Table 4: Productivity improvement.                                                                                                     Metadata Reads           Data Reads
                                                                                               100
                                                                                                                                                             Metadata Writes           Data Writes   488%
                   Development Costs             Extent          Rename                                                                                   100




                                                                                                                                                 Percentage (%)
                                                                                                          # blocks    uncontig% # access times




                                                                                       Percentage (%)
                                                                                                75
                        Manual                 4.5h (3.0×)      13h (5.4×)
                                                                                                50
                         Ours                     1.5h             2.4h                                                                                           50
                                                                                                25
                                                                                                 0                                                                                       0.1% 0.4% 0.4%
                                                                                                        Qemu Linux 8KB 16KB 5M 20M                                 0
                                                                                                                  500r/w500r/w 500w 1000w                              xv6 qemu SF LF xv6 qemu SF LF
  800       Spec       C Impl                                                                           Inline data Pre-allocation rbtree                                   Extent   Delayed Allocation
  600
                                                                                       Figure 13: Performances improvements with new features imple-
LoC




  400
  200                                                                                  mented by S PEC FS. The results were normalized before and after
      0
          File Inode IA INTF Path Util   IB   ID   Ext   PA RBT MC Enc DA    TS Log
                                                                                       optimization, and a lower percentage indicates better performance.
                    AtomFS                                    Features                 Test cases in the right are “xv6 compilation” (“xv6”), “copy qemu”
Figure 12: Lines of code comparison between specification and                          (“qemu”),“small file” (“SF”), “large file” (“LF”). The “SF” and
source code. The results contain six basic logical layers of AtomFS                   “LF” tests involve various read or write operations on multiple small
and ten new features in Tab. 2. The abbreviations are as follows.                      or large files, respectively representing metadata-intensive and data-
IA: Interface Auxiliary; INTF: Interface; Util: Utility; IB: Indirect                  intensive workloads. The data for "Delayed Allocation" that is either
Block; ID: Inline Data; Ext: Extent; PA: Pre-Allocation; RBT:                          too long or too short is marked in the figure.
rbtree for Pre-Allocation; MC: Metadata Checksums; Enc: Encryp-
tion; DA: Delayed Allocation; TS: Timestamps; Log: Logging.
                                                                                      ity by 35.4% and 21.0%, respectively.
tion and specification-driven generation for the following                            Multi-block pre-allocation. We evaluate whether the “Multi-
two patches: (1) Supporting the “extent” feature for origi-                           block Pre-allocation” feature, which integrates “Extent” and
nal AtomFS, which requires updating multiple concurrency-                             proactively allocates contiguous blocks to form a block pool
agnostic modules; and (2) Implementing the “rename” mod-                              and subsequently prioritizes drawing blocks from this pool
ule of AtomFS, which involves complex locking logic to                                during block allocation, increases the sequential read/write
ensure thread-safety. We invite two CS master students and                            ratio of file system operations. Our microbenchmarks first
two PhD students for the evaluation.                                                  create a large file and issue random writes to it at fixed page
   As shown in Tab. 4, S PEC FS improves the program-                                 sizes (e.g., 4KB or 8KB). Then, we repeatedly apply the
ming productivity of the two implementations by 3.0× and                              following process: a random region within the file is selected,
5.4×. For implementing patches involving multiple mod-                                and sequential read or write operations are issued over this
ules, S PEC FS’s design of DAG-structured specification patch                         range. Fig.13-left shows uncontiguous reads and writes ratio
allows for faster identification of all modules requiring modi-                       drops ∼30% after applying pre-allocation (we regard a read-
fication, without the need for source code analysis. S PEC FS’s                       /write operation as sequential if its range falls within a single
concurrency specifications further reduce the complexity of                           extent). This emphasizes that our pre-allocation optimization
developing sophisticated thread-safe functions.                                       enhances the contiguity of data blocks of each file.
Lines-of-code. We conducted a comparative analysis of the                             Red-black tree for pre-allocation. We evaluate how effec-
lines of code (LoC) between the specifications and the cor-                           tively the transition of the pre-allocation block pool from a
responding generated C source code. The specifications of                             linked list to a red-black tree structure reduces block pool
AtomFS are categorized by logical layers, each of which may                           access frequency. Our micro-benchmark first constructs a
encompass several modules. The specifications of Features                             file with a large block pool by employing a series of write
are categorized based on their functional characteristics, each                       operations exhibiting a specific pattern. Then, we perform
of which corresponds to the features listed in Tab.2. The re-                         random writes to the file and record the number of accesses
sults in Fig.12 show that the specification descriptions consis-                      to the block pool. As shown in Fig. 13-left, the red-black
tently require fewer lines than their corresponding generated                         tree demonstrably reduces block pool access frequency, for
C source code. This reduction in LoC implies possibly lower                           example, by 80.7% when performing 1,000 writes on a 20MB
development effort and improved productivity.                                         file. The result also indicates that the benefits of the red-black
Generation latency. The latency of code generation primarily                          tree are more pronounced with larger files.
depends on the inference performance of the LLM itself. In                            Extent. Fig.13-right shows the proportion of I/O operations
our experience, the generation time for S PEC FS typically                            (encompassing both metadata and data reads and writes) af-
ranges from several minutes to tens of minutes.                                       ter applying Extent, relative to those before applying Extent.
                                                                                      The result shows that applying Extent effectively reduces the
6.5           Performance Optimizations                                               number of I/O operations, thereby improving the performance
This section evaluates how the new features implemented by                            of the file system. It is because an extent data structure rep-
S PEC FS (§5.2, Tab.2) effectively improve the performance.                           resents a sequence of contiguous data blocks. The read and
Inline data. We first evaluate the compression effect of “In-                         write operations on this sequence of data blocks are com-
line Data” on file sizes. As shown in Fig.13-left, using inline                       pleted in a single I/O operation, rather than through multiple
data significantly reduces the file sizes of QEMU [10] and                            individual block-by-block reads and writes.
Linux source code [6], decreasing the required storage capac-                         Delayed allocation. We evaluate how the number of data
read and write operations is reduced by “Delayed Allocation”,       Domain-specific code generation. Some efforts in program
which prioritizes read and write within a global buffer, and        synthesis (e.g., SyGus [39]) also focus on automated code
flushes the buffer to the disk in a batch when it reaches the       generation. They may leverage Domain-Specific Languages
size limits. According to the results shown in Fig. 13-right,       (DSLs) to precisely articulate code logic, but face the chal-
the number of write operations is significantly reduced, with       lenges in scaling to diverse types of scenarios. E.g., MegaL-
some cases demonstrating an elimination of up to 99.9% of           ibm [12] introduces a novel DSL to construct specifications
write operations. Read operations are also reduced in most          for mathematical library functions. DryadSynth [19] focuses
cases, while in the cases such as the large file test, the number   on bit-vector synthesis building upon the SyGus methodology.
of data reads increases. The reason is that, after applying            Other research addresses LLM-based code generation for
the feature, data writes no longer directly target the disk;        specific domains outside file systems. QiMeng Xpiler [20]
instead, data is read into a buffer and write operations are        uses LLMs to construct a transcompiler that adapts low-
performed within that buffer. This may introduce additional         level tensor programs for various hardware platforms. Au-
reads, especially for regular sequential cyclic writes.             toverus [52] employs LLM-based tools for proving the correct-
6.6    Limitations and Discussion                                   ness of Rust code. OSVBench and SpecGen [30, 37] address
                                                                    generating formal specifications for a given code snippet.
Missing FS features. Although S PEC FS represents a suc-            Formal verification methods. Many studies verify com-
cessful endeavor in realizing a complex file system using           plex systems, such as operating systems [28], file sys-
S YS S PEC, S PEC FS is currently implemented as a user-space       tems [16, 55, 56], or cloud systems [47]. These efforts also
file system based on FUSE [5]. Consequently, it does not op-        involve formal specifications to ascertain the correctness of
erate in kernel mode and lacks a storage stack, such as direct      handcrafted implementations, but cannot be used diretly for
disk access, nor does it consider crash consistency. Our eval-      generative file systems. We can draw upon these existing
uation of S PEC FS primarily focuses on validating the genera-      specifications when authoring S YS S PEC for code generation.
tion methodology and ensuring correctness, which precludes
                                                                    LLM-assisted development. A separate stream of research
an apple-to-apple comparison with native kernel-space file
                                                                    applies LLMs to mitigate the burden of the file system devel-
systems regarding raw performance metrics such as through-
                                                                    opment. For example, WASABI [44] utilizes LLMs to detect
put.
                                                                    intricate retry-related problems in large-scale systems. Sys-
   We plan to apply S PEC FS to the self-evolution of industrial
                                                                    GPT [40] employs LLMs to provide developers with context-
file systems (e.g., EROFS or Ext4 [4, 23]), which is challeng-
                                                                    aware performance suggestions. However, they cannot effec-
ing due to the increased engineering complexity. To address
                                                                    tively evolve a file system like S PEC FS.
this, we consider a fully formally verified “AtomFS-Ext4”
unnecessary. Instead, we propose developing a “S PEC FS-
Ext4” directly based on documentation, using these mitigation
strategies. First, instead of specifying the whole state of Ext4,   8   Conclusion
developers can start with a minimal baseline (like Ext2) and in-
crementally add features to it. Second, we plan to enhance the      This paper presents S YS S PEC and S PEC FS, a framework and
SpecAssistant to automatically bootstrap draft specifications       a case for generative file systems. Different from traditional
from documentation (e.g., kernel wikis) or even Ext4 source         paradigms, S YS S PEC shifts the developer’s focus from writ-
code. Third, we could adapt methodologies of software engi-         ing low-level code to designing high-level specification, and
neering to guide the development of specification-constructed       S PEC FS shows the potential benefits on evolvability.
(rather than programming-language-constructed) file systems,
e.g., applying methods similar to the Law of Demeter [32] to
reduce the coupling between modules.                                Acknowledgments
Push-button verification integration. Moreover, although
SpecValidator enhances the correctness of generated code to         We are grateful to our shepherd Mai Zheng for his detailed sug-
some extent through software testing and LLM-based val-             gestions, which significantly improved the paper. We thank
idation, a greater potential of S PEC FS lies in the fact that      the anonymous FAST reviewers for their constructive feed-
each module is equipped with a ready specification. This            back. This work was supported in part by the National Natural
inherently facilitates integration with push-button verification    Science Foundation of China (No. 62432010, 62302300 and
and similar methodologies, holding the potential to achieve a       62472279), the Fundamental and Interdisciplinary Disciplines
generative and formally-verified paradigm.                          Breakthrough Plan of the Ministry of Education of China
                                                                    (JYB2025XDXM113), and the Fundamental Research Funds
7     Related Work                                                  for the Central Universities. Corresponding authors: Dong Du
                                                                    (dd_nirvana@sjtu.edu.cn), Yubin Xia (xiayubin@sjtu.
We present other related work besides the discussion in §2.3.       edu.cn), and Haibo Chen (haibochen@sjtu.edu.cn).
References                                                       [16] Haogang Chen, Daniel Ziegler, Tej Chajed, Adam Chli-
                                                                      pala, M. Frans Kaashoek, and Nickolai Zeldovich. Us-
 [1] Openai chatgpt application. https://openai.com/                  ing crash hoare logic for certifying the FSCQ file sys-
     chatgpt/overview/, 2024.                                         tem. In 2016 USENIX Annual Technical Conference
                                                                      (USENIX ATC 16), Denver, CO, June 2016. USENIX
 [2] Copilot: Your ai companion.   https://copilot.                   Association.
     microsoft.com/, 2025. Referenced May 2025.
                                                                 [17] Jonathan Corbet. Toward better testing. https://lwn.
 [3] Cursor. https://cursor.com/, 2025. Referenced                    net/Articles/591985/, 2014.
     May 2025.
                                                                 [18] DeepSeek-AI, Aixin Liu, Bei Feng, Bing Xue, Bingx-
 [4] ext4(5) — linux manual page. https://man7.org/                   uan Wang, Bochao Wu, Chengda Lu, Chenggang Zhao,
     linux/man-pages/man5/ext4.5.html, 2025.                          Chengqi Deng, Chenyu Zhang, Chong Ruan, Damai
                                                                      Dai, Daya Guo, Dejian Yang, Deli Chen, Dongjie Ji, Er-
 [5] Fuse. https://www.kernel.org/doc/html/next/                      hang Li, Fangyun Lin, Fucong Dai, Fuli Luo, Guangbo
     filesystems/fuse.html, 2025.                                     Hao, Guanting Chen, Guowei Li, H. Zhang, Han Bao,
                                                                      Hanwei Xu, Haocheng Wang, Haowei Zhang, Honghui
 [6] Github - torvalds/linux: Linux kernel source tree.               Ding, Huajian Xin, Huazuo Gao, Hui Li, Hui Qu, J. L.
     https://github.com/torvalds/linux, 2025.                         Cai, Jian Liang, Jianzhong Guo, Jiaqi Ni, Jiashi Li, Ji-
                                                                      awei Wang, Jin Chen, Jingchang Chen, Jingyang Yuan,
 [7] Google gemini 2.5 application.       https://gemini.
                                                                      Junjie Qiu, Junlong Li, Junxiao Song, Kai Dong, Kai Hu,
     google.com/app, 2025.
                                                                      Kaige Gao, Kang Guan, Kexin Huang, Kuai Yu, Lean
 [8] Gpt-5 system card.  https://cdn.openai.com/                      Wang, Lecong Zhang, Lei Xu, Leyi Xia, Liang Zhao,
     gpt-5-system-card.pdf, 2025.                                     Litong Wang, Liyue Zhang, Meng Li, Miaojun Wang,
                                                                      Mingchuan Zhang, Minghua Zhang, Minghui Tang,
 [9] Livecodebench benchmark leaderboard. https:                      Mingming Li, Ning Tian, Panpan Huang, Peiyi Wang,
     //artificialanalysis.ai/evaluations/                             Peng Zhang, Qiancheng Wang, Qihao Zhu, Qinyu Chen,
     livecodebench, 2025.                                             Qiushi Du, R. J. Chen, R. L. Jin, Ruiqi Ge, Ruisong
                                                                      Zhang, Ruizhe Pan, Runji Wang, Runxin Xu, Ruoyu
[10] Qemu: A generic and open source machine emulator                 Zhang, Ruyi Chen, S. S. Li, Shanghao Lu, Shangyan
     and virtualizer. https://www.qemu.org/, 2025. Ref-               Zhou, Shanhuang Chen, Shaoqing Wu, Shengfeng Ye,
     erenced May 2025.                                                Shengfeng Ye, Shirong Ma, Shiyu Wang, Shuang Zhou,
                                                                      Shuiping Yu, Shunfeng Zhou, Shuting Pan, T. Wang,
[11] Jinze Bai, Shuai Bai, Yunfei Chu, Zeyu Cui, Kai Dang,            Tao Yun, Tian Pei, Tianyu Sun, W. L. Xiao, Wangding
     Xiaodong Deng, Yang Fan, Wenbin Ge, Yu Han, Fei                  Zeng, Wanjia Zhao, Wei An, Wen Liu, Wenfeng Liang,
     Huang, et al. Qwen technical report. arXiv preprint              Wenjun Gao, Wenqin Yu, Wentao Zhang, X. Q. Li, Xi-
     arXiv:2309.16609, 2023.                                          angyue Jin, Xianzu Wang, Xiao Bi, Xiaodong Liu, Xi-
                                                                      aohan Wang, Xiaojin Shen, Xiaokang Chen, Xiaokang
[12] Ian Briggs, Yash Lad, and Pavel Panchekha. Implemen-
                                                                      Zhang, Xiaosha Chen, Xiaotao Nie, Xiaowen Sun, Xi-
     tation and synthesis of math library functions. Proc.
                                                                      aoxiang Wang, Xin Cheng, Xin Liu, Xin Xie, Xingchao
     ACM Program. Lang., 8(POPL), January 2024.
                                                                      Liu, Xingkai Yu, Xinnan Song, Xinxia Shan, Xinyi
[13] William Bugden and Ayman Alahmar. Rust: The pro-                 Zhou, Xinyu Yang, Xinyuan Li, Xuecheng Su, Xuheng
     gramming language for safety and performance. arXiv              Lin, Y. K. Li, Y. Q. Wang, Y. X. Wei, Y. X. Zhu, Yang
     preprint arXiv:2206.05503, 2022.                                 Zhang, Yanhong Xu, Yanhong Xu, Yanping Huang,
                                                                      Yao Li, Yao Zhao, Yaofeng Sun, Yaohui Li, Yaohui
[14] Bei Chen, Fengji Zhang, Anh Nguyen, Daoguang Zan,                Wang, Yi Yu, Yi Zheng, Yichao Zhang, Yifan Shi, Yil-
     Zeqi Lin, Jian-Guang Lou, and Weizhu Chen. Codet:                iang Xiong, Ying He, Ying Tang, Yishi Piao, Yisong
     Code generation with generated tests. arXiv preprint             Wang, Yixuan Tan, Yiyang Ma, Yiyuan Liu, Yongqiang
     arXiv:2207.10397, 2022.                                          Guo, Yu Wu, Yuan Ou, Yuchen Zhu, Yuduan Wang,
                                                                      Yue Gong, Yuheng Zou, Yujia He, Yukun Zha, Yunfan
[15] Haogang Chen, Daniel Ziegler, Tej Chajed, Adam Chli-             Xiong, Yunxian Ma, Yuting Yan, Yuxiang Luo, Yuxi-
     pala, M Frans Kaashoek, and Nickolai Zeldovich. Using            ang You, Yuxuan Liu, Yuyang Zhou, Z. F. Wu, Z. Z.
     crash hoare logic for certifying the fscq file system. In        Ren, Zehui Ren, Zhangli Sha, Zhe Fu, Zhean Xu, Zhen
     Proceedings of the 25th Symposium on Operating Sys-              Huang, Zhen Zhang, Zhenda Xie, Zhengyan Zhang,
     tems Principles, pages 18–37. ACM, 2015.                         Zhewen Hao, Zhibin Gou, Zhicheng Ma, Zhigang Yan,
     Zhihong Shao, Zhipeng Xu, Zhiyu Wu, Zhongyu Zhang,          [27] Ralf Jung, Jacques-Henri Jourdan, Robbert Krebbers,
     Zhuoshu Li, Zihui Gu, Zijia Zhu, Zijun Liu, Zilin                and Derek Dreyer. Safe systems programming in rust:
     Li, Ziwei Xie, Ziyang Song, Ziyi Gao, and Zizheng                The promise and the challenge, 2021.
     Pan. Deepseek-v3 technical report. arXiv preprint
     arXiv:2412.19437, 2025.                                     [28] Gerwin Klein, Kevin Elphinstone, Gernot Heiser, June
                                                                      Andronick, David Cock, Philip Derrin, Dhammika Elka-
[19] Yuantian Ding and Xiaokang Qiu. Enhanced enumera-                duwe, Kai Engelhardt, Rafal Kolanski, Michael Norrish,
     tion techniques for syntax-guided synthesis of bit-vector        Thomas Sewell, Harvey Tuch, and Simon Winwood.
     manipulations. Proc. ACM Program. Lang., 8(POPL),                sel4: formal verification of an os kernel. In Proceedings
     January 2024.                                                    of the ACM SIGOPS 22nd Symposium on Operating Sys-
                                                                      tems Principles, SOSP ’09, pages 207–220, New York,
[20] Shouyang Dong, Yuanbo Wen, Jun Bi, Di Huang, Ji-                 NY, USA, 2009. Association for Computing Machinery.
     aming Guo, Jianxing Xu, Ruibai Xu, Xinkai Song,
     Yifan Hao, Xuehai Zhou, et al.       Qimeng-xpiler:         [29] Changman Lee, Dongho Sim, Jooyoung Hwang, and
     Transcompiling tensor programs for deep learning sys-            Sangyeun Cho. F2FS: A new file system for flash stor-
     tems with a neural-symbolic approach. arXiv preprint             age. In 13th USENIX Conference on File and Storage
     arXiv:2505.02146, 2025.                                          Technologies (FAST 15), pages 273–286, Santa Clara,
                                                                      CA, February 2015. USENIX Association.
[21] Xinyu Feng. Local rely-guarantee reasoning. In Pro-
     ceedings of the 36th Annual ACM SIGPLAN-SIGACT              [30] Shangyu Li, Juyong Jiang, Tiancheng Zhao, and Jiasi
     Symposium on Principles of Programming Languages,                Shen. Osvbench: Benchmarking llms on specification
     POPL ’09, page 315–327, New York, NY, USA, 2009.                 generation tasks for operating system verification. arXiv
     Association for Computing Machinery.                             preprint arXiv:2504.20964, 2025.

[22] Xiang Gao, Mingkai Dong, Xie Miao, Wei Du, Chao Yu,         [31] Hongjin Liang, Xinyu Feng, and Ming Fu. A rely-
     and Haibo Chen. EROFS: A compression-friendly read-              guarantee-based simulation for verifying concurrent pro-
     only file system for resource-scarce devices. In 2019            gram transformations. In Proceedings of the 39th an-
     USENIX Annual Technical Conference (USENIX ATC                   nual ACM SIGPLAN-SIGACT symposium on Principles
     19), pages 149–162, Renton, WA, July 2019. USENIX                of programming languages, pages 455–468, 2012.
     Association.
                                                                 [32] Karl J. Lieberherr and Ian M. Holland. Assuring
[23] Xiang Gao, Mingkai Dong, Xie Miao, Wei Du, Chao Yu,              good style for object-oriented programs. IEEE Softw.,
     and Haibo Chen. EROFS: A compression-friendly read-              6(5):38–48, September 1989.
     only file system for resource-scarce devices. In 2019
     USENIX Annual Technical Conference (USENIX ATC              [33] Aixin Liu, Bei Feng, Bin Wang, Bingxuan Wang,
     19), pages 149–162, Renton, WA, July 2019. USENIX                Bo Liu, Chenggang Zhao, Chengqi Dengr, Chong Ruan,
     Association.                                                     Damai Dai, Daya Guo, et al. Deepseek-v2: A strong,
                                                                      economical, and efficient mixture-of-experts language
[24] Qi Guo, Xiaofei Xie, Shangqing Liu, Ming Hu, Xiao-               model. arXiv preprint arXiv:2405.04434, 2024.
     hong Li, and Lei Bu. Intention is all you need: Refining
     your code from your intention. In Proceedings of the        [34] Aixin Liu, Bei Feng, Bing Xue, Bingxuan Wang,
     IEEE/ACM 47th International Conference on Software               Bochao Wu, Chengda Lu, Chenggang Zhao, Chengqi
     Engineering, ICSE ’25, pages 1127–1139. IEEE Press,              Deng, Chenyu Zhang, Chong Ruan, et al. Deepseek-
     2025.                                                            v3 technical report. arXiv preprint arXiv:2412.19437,
                                                                      2024.
[25] Dong Huang, Jie M. Zhang, Michael Luck, Qingwen
     Bu, Yuhao Qing, and Heming Cui. Agentcoder: Multi-          [35] Lanyue Lu, Andrea C. Arpaci-Dusseau, Remzi H.
     agent-based code generation with iterative testing and           Arpaci-Dusseau, and Shan Lu. A study of linux file
     optimisation. arXiv preprint arXiv:2312.13010, 2024.             system evolution. In 11th USENIX Conference on File
                                                                      and Storage Technologies (FAST 13), pages 31–44, San
[26] Lei Huang, Weijiang Yu, Weitao Ma, Weihong Zhong,                Jose, CA, February 2013. USENIX Association.
     Zhangyin Feng, Haotian Wang, Qianglong Chen, Wei-
     hua Peng, Xiaocheng Feng, Bing Qin, and Ting Liu. A         [36] Lanyue Lu, Andrea C. Arpaci-Dusseau, Remzi H.
     survey on hallucination in large language models: Prin-          Arpaci-Dusseau, and Shan Lu. A study of linux file
     ciples, taxonomy, challenges, and open questions. ACM            system evolution. ACM Trans. Storage, 10(1), January
     Trans. Inf. Syst., 43(2), January 2025.                          2014.
[37] Lezhi Ma, Shangqing Liu, Yi Li, Xiaofei Xie, and Lei             making the development of llm systems an engineering
     Bu. Specgen: Automated generation of formal program              discipline. arXiv preprint arXiv:2412.05299, 2024.
     specifications via large language models. arXiv preprint
     arXiv:2401.08807, 2025.                                     [46] Chuyue Sun, Ying Sheng, Oded Padon, and Clark Bar-
                                                                      rett. Clover: Closed-loop verifiable code generation.
[38] Gian Ntzik, Pedro da Rocha Pinto, Julian Sutherland,             arXiv preprint arXiv:2310.17807, 2024.
     and Philippa Gardner. A Concurrent Specification of
     POSIX File Systems. In Todd Millstein, editor, 32nd         [47] Xudong Sun, Wenjie Ma, Jiawei Tyler Gu, Zicheng Ma,
     European Conference on Object-Oriented Programming               Tej Chajed, Jon Howell, Andrea Lattuada, Oded Padon,
     (ECOOP 2018), volume 109 of Leibniz International                Lalith Suresh, Adriana Szekeres, and Tianyin Xu. Anvil:
     Proceedings in Informatics (LIPIcs), pages 4:1–4:28,             Verifying liveness of cluster management controllers. In
     Dagstuhl, Germany, 2018. Schloss Dagstuhl – Leibniz-             18th USENIX Symposium on Operating Systems Design
     Zentrum für Informatik.                                          and Implementation (OSDI 24), pages 649–666, Santa
                                                                      Clara, CA, July 2024. USENIX Association.
[39] Saswat Padhi,      Elizabeth Polgreen,      Mukund
     Raghothaman, Andrew Reynolds, and Abhishek                  [48] Gemini Team, Petko Georgiev, Ving Ian Lei, Ryan Bur-
     Udupa. The sygus language standard version 2.1. arXiv            nell, Libin Bai, Anmol Gulati, Garrett Tanzer, Damien
     preprint arXiv:2312.06001, 2023.                                 Vincent, Zhufeng Pan, Shibo Wang, et al. Gemini 1.5:
[40] Sujin Park, Mingyu Guan, Xiang Cheng, and Taesoo                 Unlocking multimodal understanding across millions
     Kim. Principles and methodologies for serial perfor-             of tokens of context. arXiv preprint arXiv:2403.05530,
     mance optimization. In 19th USENIX Symposium on                  2024.
     Operating Systems Design and Implementation (OSDI
     25), pages 357–373, 2025.                                   [49] Zora Zhiruo Wang, Akari Asai, Xinyan Velocity Yu,
                                                                      Frank F. Xu, Yiqing Xie, Graham Neubig, and Daniel
[41] Harshad Shirwadkar, Saurabh Kadekodi, and Theodore               Fried. Coderag-bench: Can retrieval augment code
     Tso. FastCommit: resource-efficient, performant and              generation? arXiv preprint arXiv:2406.14497, 2025.
     cost-effective file system journaling. In 2024 USENIX
     Annual Technical Conference (USENIX ATC 24), pages          [50] Ziwei Xu, Sanjay Jain, and Mohan Kankanhalli. Hal-
     157–171, Santa Clara, CA, July 2024. USENIX Associ-              lucination is inevitable: An innate limitation of large
     ation.                                                           language models. arXiv preprint arXiv:2401.11817,
                                                                      2025.
[42] Helgi Sigurbjarnarson, James Bornholt, Emina Torlak,
     and Xi Wang. Push-Button verification of file sys-          [51] An Yang, Anfeng Li, Baosong Yang, Beichen Zhang,
     tems via crash refinement. In 12th USENIX Sympo-                 Binyuan Hui, Bo Zheng, Bowen Yu, Chang Gao, Chen-
     sium on Operating Systems Design and Implementation              gen Huang, Chenxu Lv, Chujie Zheng, Dayiheng Liu,
     (OSDI 16), pages 1–16, Savannah, GA, November 2016.              Fan Zhou, Fei Huang, Feng Hu, Hao Ge, Haoran Wei,
     USENIX Association.                                              Huan Lin, Jialong Tang, Jian Yang, Jianhong Tu, Jian-
                                                                      wei Zhang, Jianxin Yang, Jiaxi Yang, Jing Zhou, Jingren
[43] Thodoris Sotiropoulos, Stefanos Chaliasos, and Zhen-
                                                                      Zhou, Junyang Lin, Kai Dang, Keqin Bao, Kexin Yang,
     dong Su. Api-driven program synthesis for testing static
                                                                      Le Yu, Lianghao Deng, Mei Li, Mingfeng Xue, Mingze
     typing implementations. Proc. ACM Program. Lang.,
                                                                      Li, Pei Zhang, Peng Wang, Qin Zhu, Rui Men, Ruize
     8(POPL), January 2024.
                                                                      Gao, Shixuan Liu, Shuang Luo, Tianhao Li, Tianyi Tang,
[44] Bogdan Alexandru Stoica, Utsav Sethi, Yiming Su,                 Wenbiao Yin, Xingzhang Ren, Xinyu Wang, Xinyu
     Cyrus Zhou, Shan Lu, Jonathan Mace, Madanlal Musu-               Zhang, Xuancheng Ren, Yang Fan, Yang Su, Yichang
     vathi, and Suman Nath. If at first you don’t succeed,            Zhang, Yinger Zhang, Yu Wan, Yuqiong Liu, Zekun
     try, try, again...? insights and llm-informed tooling for        Wang, Zeyu Cui, Zhenru Zhang, Zhipeng Zhou, and
     detecting retry bugs in software systems. In Proceed-            Zihan Qiu. Qwen3 technical report. arXiv preprint
     ings of the ACM SIGOPS 30th Symposium on Operating               arXiv:2505.09388, 2025.
     Systems Principles, SOSP ’24, pages 63–78, New York,
     NY, USA, 2024. Association for Computing Machinery.         [52] Chenyuan Yang, Xuheng Li, Md Rakib Hossain Misu,
                                                                      Jianan Yao, Weidong Cui, Yeyun Gong, Chris Haw-
[45] Ion Stoica, Matei Zaharia, Joseph Gonzalez, Ken Gold-            blitzel, Shuvendu Lahiri, Jacob R. Lorch, Shuai Lu,
     berg, Koushik Sen, Hao Zhang, Anastasios Angelopou-              Fan Yang, Ziqiao Zhou, and Shan Lu. Autoverus: Au-
     los, Shishir G. Patil, Lingjiao Chen, Wei-Lin Chiang,            tomated proof generation for rust code. Proc. ACM
     and Jared Q. Davis. Specifications: The missing link to          Program. Lang., 9(OOPSLA2), October 2025.
[53] Kechi Zhang, Jia Li, Ge Li, Xianjie Shi, and Zhi
     Jin. Codeagent: Enhancing code generation with tool-
     integrated agent systems for real-world repo-level cod-
     ing challenges. arXiv preprint arXiv:2401.07339, 2024.
[54] Yuntong Zhang, Haifeng Ruan, Zhiyu Fan, and Abhik
     Roychoudhury. Autocoderover: Autonomous program
     improvement. In Proceedings of the 33rd ACM SIG-
     SOFT International Symposium on Software Testing and
     Analysis, ISSTA 2024, pages 1592–1604, New York,
     NY, USA, 2024. Association for Computing Machin-
     ery.

[55] Mo Zou, Haoran Ding, Dong Du, Ming Fu, Ronghui Gu,
     and Haibo Chen. Using concurrent relational logic with
     helpers for verifying the atomfs file system. In Proceed-
     ings of the 27th ACM Symposium on Operating Systems
     Principles, SOSP ’19, pages 259–274, New York, NY,
     USA, 2019. Association for Computing Machinery.
[56] Mo Zou, Dong Du, Mingkai Dong, and Haibo Chen.
     Using dynamically layered definite releases for verify-
     ing the RefFS file system. In 18th USENIX Sympo-
     sium on Operating Systems Design and Implementation
     (OSDI 24), pages 629–648, Santa Clara, CA, July 2024.
     USENIX Association.
A     Artifact Appendix                                            Requirements
                                                                       • Operating System: Linux is required (tested on De-
Abstract                                                                 bian/Ubuntu).
This artifact contains the source code and scripts required to
                                                                       • Hardware/Software: The system must support FUSE
reproduce the results presented in the paper. The artifact in-
                                                                         (Filesystem in Userspace). Required packages include
cludes the SpecFS filesystem generation pipeline using Large
                                                                         fuse, libfuse-dev, gcc, make, and python3.
Language Models (LLMs) and end-to-end evaluation work-
flows. It supports reproducing the filesystem generation from          • Python Environment: The project uses uv for depen-
high-level specifications, executing automated accuracy and              dency management.
performance benchmarks, and regenerating the plots reported
in the paper.                                                          • API Access: An API key is required for the LLM back-
                                                                         end. The artifact supports Google AI (Gemini, recom-
Scope                                                                    mended) or DeepSeek.
The artifact allows for the validation of the following main
claims made in the paper:                                          B     Case Study: dentry_lookup
    • Accuracy: The SpecFS filesystem generated by the
      framework accurately implements the given specifica-         We take dentry_lookup function as an representative exam-
      tions. Validation is confirmed when the generated filesys-   ple to illustrate the specification and the code generated from
      tem passes all functional tests in the pipeline.             it.

    • Productivity: The specification descriptions consis-         B.1     Specification
      tently require fewer lines of code than their correspond-    Phase 1: Initial Implementation. Provide a complete C file
      ing generated C source code across evaluated modules,        that implements the dentry_lookup operation. You can use
      demonstrating improved developer productivity.               information from [RELY], [GUARANTEE], and [SPECIFI-
                                                                   CATION] as described below. Please output only the resulting
    • Performance Optimizations: The artifact validates that
                                                                   file.
      specific optimizations produce measurable performance
                                                                   [RELY]
      improvements. The evaluation results allow for a qualita-
      tive comparison against the trends reported in the paper.    Predefined Structures/Functions

Contents                                                           struct qstr {
                                                                      unsigned int hash;
The artifact is organized as follows:                                 unsigned int len;
                                                                      const unsigned char *name;
    • sysspec/: Contains the high-level filesystem specifica-
                                                                   };
      tions and the logic for generating the filesystem imple-     struct dentry {
      mentation.                                                      struct qstr d_name;
    • eval/: Includes evaluation artifacts for comparing base-        struct dentry *d_parent;
                                                                      struct hlist_node d_hash;
      lines against optimized versions.
                                                                      atomic_t d_count;
    • data/ & tests/: Datasets and scripts used by evalua-            spinlock_t d_lock;
      tion workloads and validation tests.                         };
                                                                   struct hlist_head { /* ... */ };
    • tools/ & plot/: Utility scripts for the pipeline and         struct hlist_node { /* ... */ };
      scripts for generating the figures.
                                                                   struct hlist_head* d_hash(struct dentry* parent,
    • gen.py: The main script to run the generation pipeline       ,→ unsigned int hash);
      and functional validation.                                   int memcmp(const void *s1, const void *s2,
                                                                   ,→ size_t n);
    • eval.py: The main script to execute benchmarks and           int d_unhashed(struct dentry* dentry);
      reproduce evaluation results.
                                                                   #define hlist_entry(ptr, type, member)
Hosting                                                            ,→ container_of(ptr,type,member)
The artifact is hosted on GitHub (branch main): https:
                                                                   [GUARANTEE]
//github.com/LLMNativeOS/specfs-ae. The repository
includes a detailed README.md file explaining the specific         API Compliance: The function must have the exact signa-
claims and expected results.                                           ture declared below:
struct dentry * dentry_lookup(struct dentry *                     // Enters an RCU read-side critical section
,→ parent, struct qstr * name);                                   void rcu_read_lock(void);
                                                                  // Exits an RCU read-side critical section
[SPECIFICATION]                                                   void rcu_read_unlock(void);
Precondition: parent and name are valid pointers.                 // Safely dereference a pointer in an RCU
                                                                  ,→ critical section
Postcondition: The function’s behavior depends on whether         struct hlist_node* rcu_dereference(struct
a matching dentry is found.                                       ,→ hlist_node* p);
                                                                  // Acquires a spinlock
Case 1 (Success) If a child dentry of parent is found with        void spin_lock(spinlock_t *lock);
    a name that matches name, and this dentry is currently        // Releases a spinlock
    active (not unhashed), then:                                  void spin_unlock(spinlock_t *lock);
                                                                  // Increment a counter atomicly
        • The reference count (d_count) of the found dentry       void atomic_inc(atomic_t *v);
          is incremented.
                                                                    The locking algorithm for dentry_lookup has three main
        • A pointer to the found dentry is returned.              components:
                                                                  Component 1: RCU-Protected Traversal
Case 2 (Failure) If no active child dentry of parent with a
                                                                  Precondition: No RCU lock is held.
    matching name is found, the function returns NULL.
                                                                  Postcondition: No RCU lock is held.
System Algorithm:                                                 System Algorithm:
                                                                   1. Before starting the search, call rcu_read_lock() to
 1. Extract the hash, length, and string from the name pa-            enter an RCU critical section.
    rameter.
                                                                   2. After the search is complete (whether a dentry is found
 2. Use the d_hash utility to find the correct hash bucket            or not), call rcu_read_unlock() to exit the critical sec-
    (hlist_head) associated with the parent dentry.                   tion.

 3. Iterate through each dentry in the hash bucket in a loop.      3. Pointers within the hash list must be accessed via
                                                                      rcu_dereference() to ensure the most up-to-date
 4. For each dentry, perform the following checks:                    value is read safely.

       a. First, compare the hash value with name->hash. If       Component 2: Per-Dentry Spinlock
          they don’t match, skip to the next dentry.              Precondition: The code is inside an RCU read-side critical
                                                                  section.
       b. Next, check if dentry->d_parent is the same as          Postcondition: In all code paths after the lock has been ac-
          the input parent. If not, skip.                         quired (e.g., after a successful match, after a failed re-check,
       c. Perform a full name comparison: compare the             or after a failed name comparison), the dentry->d_lock is
          lengths (dentry->d_name.len and name->len)              released.
          and then use memcmp to compare the string content.      System Algorithm:
          If the names do not match, skip to the next dentry.
                                                                   1. Inside the hash list traversal loop, after finding a candi-
       d. If all checks pass, verify that the dentry is not un-       date dentry (i.e., its hash matches), acquire its individual
          hashed using d_unhashed().                                  spinlock.
       e. If it is not unhashed, this is a successful match.       2. Critical Re-check: Immediately after acquiring the
          Break the loop.                                             lock, re-check that dentry->d_parent still points to
                                                                      the parent you are searching under. If the parent no
 5. If a match was found, increment its d_count and return
                                                                      longer matches, release the lock and continue to the next
    it. Otherwise, return NULL.
                                                                      dentry.
Phase 2: Concurrency Refinement. Please refine the above           3. While holding the spinlock, perform the full, defini-
dentry_lookup function to correctly handle locks for con-             tive name comparison.       The lock ensures that
currency. Please output only the resulting code. You can rely         dentry->d_name will not change.
on the following information.
[RELY]                                                             4. If the name matches and the dentry is not unhashed,
                                                                      increment its reference count. This action must be per-
Predefined Structures/Functions                                       formed before releasing the lock.
Component 3: Atomic counter Incrementation                        rcu_read_lock();
Precondition: No lock is held on the counter.
Postcondition: The counter of the dentry is atomicly incre-       struct hlist_head *head = d_hash(parent,
mented. No lock is held on the counter.                           ,→ hash);

B.2     Code Snippet                                              for (node = rcu_dereference(head->first); node
                                                                  ,→ != NULL;
Phase 1: Initial Implementation.                                      node = rcu_dereference(node->next)) {
struct dentry * dentry_lookup(struct dentry *
                                                                       struct dentry *dentry = hlist_entry(node,
,→ parent, struct qstr * name) {
                                                                       ,→ struct dentry, d_hash);
   unsigned int hash = name->hash;
   unsigned int len = name->len;
                                                                       if (dentry->d_name.hash != hash)
   const unsigned char *str = name->name;
                                                                           continue;
    struct hlist_head *head = d_hash(parent,
                                                                       spin_lock(&dentry->d_lock);
    ,→ hash);
    struct hlist_node *node;
                                                                       if (dentry->d_parent != parent) {
    struct dentry *found = NULL;
                                                                           spin_unlock(&dentry->d_lock);
                                                                           continue;
    for (node = head->first; node != NULL; node =
                                                                       }
    ,→ node->next) {
       struct dentry *dentry = hlist_entry(node,
                                                                       if (dentry->d_name.len != name->len
        ,→ struct dentry, d_hash);
                                                                           memcmp(dentry->d_name.name, name->name,
                                                                            ,→ name->len) != 0) {
        if (dentry->d_name.hash != hash)
                                                                           spin_unlock(&dentry->d_lock);
            continue;
                                                                           continue;
                                                                       }
        if (dentry->d_parent != parent)
            continue;
                                                                       if (d_unhashed(dentry)) {
                                                                           spin_unlock(&dentry->d_lock);
        if (dentry->d_name.len != len)
                                                                           continue;
            continue;
                                                                       }
        if (memcmp(dentry->d_name.name, str, len) !=
                                                                       atomic_inc(&dentry->d_count);
        ,→  0)
                                                                       spin_unlock(&dentry->d_lock);
            continue;
                                                                       found = dentry;
        if (d_unhashed(dentry))
                                                                       break;
            continue;
                                                                  }
        found = dentry;
                                                                  rcu_read_unlock();
        break;
    }
                                                                  return found;
                                                              }
    if (found) {
        found->d_count.counter++;
        return found;                                         C    DAG-Structured Patches for Features
    }
                                                              Fig.14 presents the DAG structures of patches used to imple-
    return NULL;
                                                              ment the ten new features of SpecFS.
}

Phase 2: Refined Implementation.

struct dentry * dentry_lookup(struct dentry *
,→ parent, struct qstr * name) {
   struct hlist_node *node;
   struct dentry *found = NULL;
   unsigned int hash = name->hash;
                                                                                                       extent            extent and prealloc                 prealloc with                  extent
               Root Identifier                                                                                                                                  rbtree                  initialization
                                                                                                   initialization            operations
               Leaf Node                                                                               inode                     inode                          inode                       inode
                                                                                                   initialization             management                     management                 initialization
               Intermediate Node                                                                                                                                                                                                                          inode init with      file operations
                                                             extent                extent                                                                                                                   initalize inode      file operations with     en/decryption      with en/decryption
                                                                                                                              lowlevel_file                      lowlevel_file
                                                         initialization          operations                                                                                                                   with buffer        delayed allocation
                                                                                                                                                                                                                                                               inode
                                                                                                                                                                                                                                                                                lowlevel_file
                                                                                                                                                                                       inode & extent               inode                                  initialization
       indirect block            inline data                 inode                 inode          inode & extent                                                   mballoc
                                                                                                                                 mballoc                                                  structure                                 lowlevel_file
                                                         initialization         management           structure                                                                                                  initialization

                                                        inode & extent                                                                                                                                           inode with                                                     encryption &
        lowlevel_file           lowlevel_file                                    lowlevel_file                           contiguous_malloc           contiguous_malloc             red-black tree                                   delay_alloc          inode with key
                                                           structure                                                                                                                                               buffer                                                        decryption


 (a) Indirect Block (b) Inline Data                               (c) Extent                     (d) Multi Block Pre-Allocation                        (e) rbtree for Pre-Allocation                            (f) Delayed Allocation                          (g) Encryption
                                                                                                   read/write log       read/write log            start/end              start/end             start/end
                                                                                                     with inode          with directory        transactions at      transactions at         transactions at
                                                                                                                                                                                                                                                                      outer interface for
                                                                                                     operations           operations          rename interface        file interface      directory interface                                  main_rename
                                                                                                                                                                                                                                                                     rename operations
    checksum            inode operations   file operations       directory operations
   initialization        with checksum     with checksum            with checksum                     inode                   directory                                                                                                                               outer interface for
                                                                                                                                               main_rename             main_file               main_dir                     timestamp               main_file
                                                                                                   management                operations                                                                                                                                file operations
       inode                 inode                                         directory                                                                                                                                                                                  outer interface for
                                                lowlevel_file
   initialization         management                                      operations                                                                                                                                                                main_dir
                                                                                                                    log_rw                                             log_trans                                                                                     directory operations
   inode with                                                                                                                                                                                                               inode with                                outer interace for
                           checksum                                                                                                                                                                                                            fuse interface
   checksum                                                                                                                                                                                                                timestamps                                        fuse
                                                                                                    log_delete                 log_get                                 flush_log

                    (h) Metadata Checksum                                                                                                     (i) Logging                                                                                    (j) Timestamps


Figure 14: Features implemented by SpecFS. For simplicity, a node in the figure may encompass multiple modules of specifications. “Root
Identifier” indicates that this node is the root node, along with its associated logic.
